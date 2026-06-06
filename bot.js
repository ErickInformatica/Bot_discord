const { Client, GatewayIntentBits, EmbedBuilder, VoiceChannel, MessageEmbed, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const { OpusEncoder } = require('@discordjs/opus');
const fs = require('fs');
const path = require('path');
const config = require('./auth.json');
const ffmpegPath = require('ffmpeg-static');
const prism = require('prism-media');
const { spawn } = require('child_process');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const https = require('https');

const AUDIO_EXTENSIONS = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.opus']);

const normalizeAudioName = (value) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const resolveAudioFile = (audioFile) => {
    const directPath = path.join(__dirname, audioFile);
    if (fs.existsSync(directPath)) {
        return directPath;
    }

    const normalizedTarget = normalizeAudioName(audioFile);
    const match = fs.readdirSync(__dirname).find(fileName =>
        AUDIO_EXTENSIONS.has(path.extname(fileName).toLowerCase()) &&
        normalizeAudioName(fileName) === normalizedTarget
    );

    return match ? path.join(__dirname, match) : directPath;
};

const ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg';
const ytdlpBin = process.env.YTDLP_PATH || 'yt-dlp';
const ytdlpCookiesPath = process.env.YTDLP_COOKIES;
const URL_REGEX = /^https?:\/\//i;
const SPOTIFY_REGEX = /^(https?:\/\/open\.spotify\.com\/|spotify:)/i;
const MUSIC_TIMEOUT_MS = 20 * 60 * 1000;

console.log('FFmpeg bin:', ffmpegBin);
console.log('yt-dlp bin:', ytdlpBin);
console.log('yt-dlp cookies:', ytdlpCookiesPath ? ytdlpCookiesPath : 'no configuradas');
console.log('FFmpeg static path:', ffmpegPath || 'no disponible');

const getYtdlpSharedArgs = () => ytdlpCookiesPath ? ['--cookies', ytdlpCookiesPath] : [];

const toSpotifyUrl = (value) => {
    if (!value.startsWith('spotify:')) {
        return value;
    }

    const [, type, id] = value.split(':');
    return type && id ? `https://open.spotify.com/${type}/${id}` : value;
};

const fetchJson = (url) => new Promise((resolve, reject) => {
    https.get(url, (res) => {
        let body = '';

        res.on('data', chunk => {
            body += chunk;
        });

        res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                reject(new Error(`HTTP ${res.statusCode} al consultar ${url}`));
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
    }).on('error', reject);
});

const getSpotifySearchText = async (spotifyInput) => {
    const spotifyUrl = toSpotifyUrl(spotifyInput);
    const data = await fetchJson(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`);
    if (!data.title) {
        throw new Error('No pude leer el título de Spotify.');
    }

    return data.title.replace(/\s*\|\s*Spotify\s*$/i, '').trim();
};

const runBufferedCommand = (command, args, timeoutMs = 20000) => new Promise((resolve, reject) => {
    const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`${command} tardó demasiado en responder`));
    }, timeoutMs);

    child.stdout.on('data', data => {
        stdout += data.toString();
    });

    child.stderr.on('data', data => {
        stderr += data.toString();
    });

    child.on('error', error => {
        clearTimeout(timeout);
        reject(error);
    });

    child.on('close', code => {
        clearTimeout(timeout);
        if (code === 0) {
            resolve(stdout);
        } else {
            reject(new Error(stderr.trim() || `${command} terminó con código ${code}`));
        }
    });
});

const getYtdlpInfo = async (source) => {
    const output = await runBufferedCommand(ytdlpBin, [
        ...getYtdlpSharedArgs(),
        '--dump-single-json',
        '--no-playlist',
        '--skip-download',
        source
    ]);

    const info = JSON.parse(output);
    if (Array.isArray(info.entries) && info.entries.length > 0) {
        return info.entries[0];
    }

    return info;
};

const resolveMusicSource = async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        throw new Error('No recibí canción, link o búsqueda.');
    }

    if (SPOTIFY_REGEX.test(trimmedQuery)) {
        const search = await getSpotifySearchText(trimmedQuery);

        return {
            input: `ytsearch1:${search}`,
            title: search,
            requestedQuery: trimmedQuery,
        };
    }

    if (URL_REGEX.test(trimmedQuery)) {
        const info = await getYtdlpInfo(trimmedQuery);
        return {
            input: trimmedQuery,
            title: info.title || trimmedQuery,
            url: info.webpage_url || trimmedQuery,
            requestedQuery: trimmedQuery,
        };
    }

    const info = await getYtdlpInfo(`ytsearch1:${trimmedQuery}`);
    return {
        input: `ytsearch1:${trimmedQuery}`,
        title: info.title || trimmedQuery,
        url: info.webpage_url,
        requestedQuery: trimmedQuery,
    };
};

// Configurar ruta básica para mantener vivo el servicio
app.get('/', (req, res) => {
    res.send('¡Bot Discord está vivo! 🤖');
});

// Iniciar el servidor Express
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});

const cooldowns = new Collection();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const commandCoolDown = (userId, commandName, duration) => {
    const now = Date.now();
    const timestamps = cooldowns.get(commandName);
    const cooldownAmount = duration;

    if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return timeLeft;
        }
    }

    // Set or update the cooldown
    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);

    return null;
};

// Configuración de comandos
const commandConfig = {
    esta: {
        embedConfig: {
            title: 'PARA EL PUTO',
            color: 'Red',
            getDescription: (args) => `Esta .l. para el puto ${args.join(' ')}!`,
            images: [
                'https://i.ibb.co/QnjTL6B/trash-finger.gif',
                'https://i.ibb.co/MGCn3J9/hat-finger.gif',
                'https://i.ibb.co/JQ90Rjv/hail-finger.gif',
                'https://i.ibb.co/zPLZrjj/pichu-finger.gif',
                'https://i.ibb.co/r2bxg7J/window-finger.gif',
                'https://i.ibb.co/mNy3rND/kid-finger.gif',
                'https://i.ibb.co/vX8sN44/girl-finger.gif',
                'https://i.ibb.co/tQXqSLD/feet-finger.gif',
                'https://i.ibb.co/mcv1Yr8/happykid-finger.gif',
                'https://i.ibb.co/VxGq8p4/baby-finger.gif',
                'https://i.ibb.co/HpFRvTX/horse-finger.gif',
            ]
        },
        requiresVoice: false
    },
    picoteando: {
        embedConfig: {
            title: 'ME ESTA PICOTEANDO',
            color: 'Aqua',
            getDescription: (args) => `Vean banda me esta picoteando, ${args.join(' ')}! AHHH!! PUTO!! SUELTAME ALV!!`,
            image: 'https://i.ibb.co/cJhDGyN/picoteando.gif'
        },
        audioFile: 'me-esta-picando-banda.m4a',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    adiosito: {
        embedConfig: {
            title: 'BESOS, BESITOS, BESOS',
            color: 'Red',
            getDescription: (args) => `VAMONOS ALV ${args.join(' ')}!`,
            image: 'https://i.ibb.co/LhHDhqG/Webp-net-gifmaker.gif'
        },
        audioFile: 'kevin-audio.m4a',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    'ñam': {
        embedConfig: {
            title: 'A COMER PUERCAS!!!',
            color: 'Red',
            description: 'ÑAÑAÑAÑAÑAÑAÑAÑAÑAÑA',
            image: 'https://i.ibb.co/zZkStgV/nanana.gif'
        },
        audioFile: 'calichin.m4a',
        requiresVoice: true
    },
    kansas: {
        embedConfig: {
            title: 'SOY GAY SOY GAY Y NO TIENE NADA DE MALO',
            color: 'Red',
            description: 'FORTINAITI!!!',
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Ere Gay?')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://www.youtube.com/watch?v=h3Bcjy0l6Yw')
                    )
            ]
        },
        audioFile: 'soy-gay-y-no-tiene-nada-de-malo.m4a',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    yip: {
        embedConfig: {
            title: 'ASDFASGADSFKAJSDHFKJALSDFHASLDF',
            color: 'Red',
            description: 'ASI COMO LO OYERON PUTOS',
            image: 'https://i.ibb.co/n8Kknsb/nigel-thornberry-kid.gif'
        },
        audioFile: 'kansas.m4a',
        requiresVoice: true
    },
    pozole: {
        embedConfig: {
            title: 'WORT WORT WORT',
            color: 'Aqua',
            getDescription: () => 'WORT WORT WORT, POZOLE?',
            image: 'https://i.ibb.co/MSCF5qH/pozole.png'
        },
        audioFile: 'pozole-loudess2.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    breach: {
        embedConfig: {
            title: 'LEEEEETSSS GOOOO!!',
            color: 'Aqua',
            getDescription: () => 'LETS GO?',
            image: 'https://i.ibb.co/pXS3DvF/image.png'
        },
        audioFile: 'Voicy_LETS GO.mp3',
        requiresVoice: true
    },
    unmedico: {
        embedConfig: {
            title: 'AYUDAAAA UN MEDICOOOOOOOO',
            color: 'Aqua',
            getDescription: () => 'REVIVA ZORRA XD',
            image: 'https://i.ibb.co/ChmPC9V/edgar-sage.png'
        },
        audioFile: 'SAGE.mp3',
        requiresVoice: true
    },
    cerda: {
        embedConfig: {
            title: 'oye nena acaso eres una cerda de angry birds 🥵',
            color: 'Aqua',
            getDescription: () => 'CERDA',
            image: 'https://i.ibb.co/V3hGbbp/image.png'
        },
        audioFile: 'ANGRY BIRDS.mp3',
        requiresVoice: true
    },
    hdp: {
        embedConfig: {
            title: 'ME VOY A ALIAR CON SIRIA',
            color: 'Aqua',
            getDescription: () => 'HIJOS DE PUTAAAAA!',
            image: 'https://i.ibb.co/yB1Jw1r/image.png'
        },
        audioFile: 'Me voy aliar con siri.mp3',
        requiresVoice: true
    },
    bobo: {
        embedConfig: {
            title: 'ANDA PA ASHA BOBO!',
            color: 'Aqua',
            getDescription: () => 'BOBO!',
            image: 'https://i.ibb.co/Rj641Tv/image.png'
        },
        audioFile: 'gekko.mp3',
        requiresVoice: true
    },
    barberia: {
        embedConfig: {
            title: 'PASO LA MUNI',
            color: 'Aqua',
            getDescription: () => 'EN LA BARBERIAAAA!',
            image: 'https://i.ibb.co/K6z9hxb/barberia.jpg'
        },
        audioFile: 'BARBERIA.mp3',
        requiresVoice: true
    },
    compe: {
        embedConfig: {
            title: 'VA VEEEEER COMPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
            color: 'Aqua',
            getDescription: () => 'PERROS TRIPLE IJUEPUTAS!',
            image: 'https://i.ibb.co/zXbVSdF/images-1.jpg'
        },
        audioFile: 'COMPE.mp3',
        requiresVoice: true
    },
    chatarra: {
        embedConfig: {
            title: 'SE COMPRAAAAA LA CHATARRAAAAA',
            color: 'Aqua',
            getDescription: () => 'SE COMPRAAAAA LA CHATARRAAAAA',
            image: 'https://i.ibb.co/gmTfm8Q/kevin-sabrozo-removebg-preview.png'
        },
        audioFile: 'chatarra.mp3',
        requiresVoice: true
    },
    mp: {
        embedConfig: {
            title: 'MP',
            color: 'Aqua',
            getDescription: () => 'MANCOS PROMEDIO',
            image: 'https://i.ibb.co/dcn0qmb/Imagen-de-Whats-App-2023-12-16-a-las-17-53-12-38ee33c7.jpg'
        },
        audioFile: 'MP.mp3',
        requiresVoice: true
    },
    woosh: {
        embedConfig: {
            title: 'WOOOOSHHH!! MAMAEGG',
            color: 'Red',
            description: 'WOOOOSHHH!!',
            image: 'https://i.ibb.co/pZrXNJX/woosh.jpg'
        },
        requiresVoice: false
    },
    wooshnt: {
        embedConfig: {
            title: 'WOOOOSHHHN\'T!! BITCH',
            color: 'Red',
            description: 'WOOOOSHHHN\'T!!',
            image: 'https://i.ibb.co/cQCJc2D/wooshnt.png'
        },
        requiresVoice: false
    },
    yolepregunte: {
        embedConfig: {
            title: 'TRANQUILOS!! YO LE PREGUNTE',
            color: 'Aqua',
            getDescription: () => 'YO PREGUNTE',
            image: 'https://i.ibb.co/9kNRp5Xt/2025-02-20-16-07-39.gif'
        },
        audioFile: 'yo-le-pregunte.mp3',
        requiresVoice: false,
        audioRequiresVoice: true,
        aliases: ['tranquilos']
    },
    "10min": {
        embedConfig: {
            title: 'AHORITA CAIGO EN 10 MINUTOS',
            color: 'Aqua',
            getDescription: () => 'GORDA TIME',
            image: 'https://i.ibb.co/5X8DD4sw/10MIN.jpg'
        },
        requiresVoice: false
    },
    taxista: {
        embedConfig: {
            title: 'ALGUIEN PIDIO UBER?',
            color: 'Aqua',
            getDescription: () => 'SALE UBER ANTIGUA!',
            image: 'https://i.ibb.co/ycF4wvHS/taxista.png'
        },
        audioFile: 'taxista.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    macaco: {
        embedConfig: {
            title: 'INVOCO AL SALVAJE MACACO!',
            color: 'Aqua',
            getDescription: () => 'COMO LOS MACACOS XD',
            image: 'https://i.ibb.co/mF0pGmwT/3f964206-9d6c-49a8-9faf-7e8cb753d710.gif'
        },
        audioFile: 'macacos.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    ninoninoni: {
        embedConfig: {
            title: 'CORRAN YA APARECIO EL DINOCOMPES!',
            color: 'Aqua',
            getDescription: () => 'DIGO, NINONINONI!',
            image: 'https://i.ibb.co/93bKCJ56/ninoni.jpg'
        },
        audioFile: 'Ninoninoni.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    shokansas: {
        embedConfig: {
            title: 'SHOOOOOOOOOOOOOOOOOOO! KANSAS!!!!!',
            color: 'Aqua',
            getDescription: () => 'SHOOOOOOOOOOOOOOOOOOO!',
            image: 'https://i.ibb.co/twFr5j8r/shut-up.gif'
        },
        audioFile: 'SHOO.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    hayunamujer: {
        embedConfig: {
            title: 'HAYYYY UNA MUJEEEEEEER!!',
            color: 'Aqua',
            getDescription: () => 'SPICY, QA, F1!!',
            image: 'https://i.ibb.co/6RhxrWH8/kevin-sabrozo.jpg'
        },
        audioFile: 'hayunamujer.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    torneo: {
        embedConfig: {
            title: 'ES HORA DE DE DE DE DEL DUELO!',
            color: 'Aqua',
            getDescription: () => 'SALIO TORNEO!',
            image: 'https://i.ibb.co/Y7J4DVN2/duelo.gif'
        },
        audioFile: 'ES HORA DE DE DE DE DE DEL DUELO!.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    tribu: {
        embedConfig: {
            title: 'KISHEEEE LA TRIBU!!',
            color: 'Aqua',
            getDescription: () => 'UNGA UNGA! INVOCO AL MONO CAPUCHINO',
            image: 'https://i.ibb.co/RpPtm6PK/received-919155221521744.jpg'
        },
        audioFile: 'tribu.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    nahual: {
        embedConfig: {
            title: 'YA LLEGO EL NAGUAL!!',
            color: 'Aqua',
            getDescription: () => 'INEI KUDESAI UNYUNGA UNTAYÁ',
            image: 'https://i.ibb.co/0VWqKK9n/nahual-nite.gif'
        },
        audioFile: 'nahual.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    sniper: {
        embedConfig: {
            title: 'QUIEN ES DIEGO SNIPER!!',
            color: 'Aqua',
            getDescription: () => 'YOU WANT TO PLAY? LETS PLAY',
            image: 'https://i.ibb.co/ccpqzYLz/caliche-sniper.png'
        },
        audioFile: 'Quien es Diego Sniper_.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    piedra: {
        embedConfig: {
            title: 'AUYENTAS A LAS PUERCAS DE LAS COMPES!!',
            color: 'Aqua',
            getDescription: (args) => `SUVASHE PA' AYA ${args.join(' ')}, VAYA CHARSE`,
            image: 'https://i.ibb.co/B5fCWHj2/piedra.png'
        },
        requiresVoice: false
    },
    cola: {
        embedConfig: {
            title: 'SALIERON LAS COMPES!!',
            color: 'Aqua',
            getDescription: () => 'YUPIIIIIIIIII 🤡',
            image: 'https://i.ibb.co/xqx2ghZ6/Los-Padrinos-M-gicos-Esta-es-la-atracci-n.gif'
        },
        audioFile: 'Los Padrinos Mágicos - Esta es la atracción.mp3',
        requiresVoice: false,
        audioRequiresVoice: true,
        aliases: ['atraccion','colacompe']
    },
    taxiantigua: {
        embedConfig: {
            title: 'YO LA CONOCI EN UN TAXI!!!',
            color: 'Aqua',
            getDescription: () => 'SALE CLUB ANTIGUA!',
            image: 'https://i.ibb.co/4RJyfjhg/chapugato.png'
        },
        audioFile: 'yo la conoci en un taxi.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    quintero: {
        embedConfig: {
            title: 'QUINTEROOOO!!!',
            color: 'Aqua',
            getDescription: () => 'QUINTEROOOO!',
            image: 'https://i.ibb.co/TDq6S9vW/image.png'
        },
        audioFile: 'Gol de Quintero a Boca.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    morfeo: {
        embedConfig: {
            title: 'MORFEEOOOOOOOO!!!',
            color: 'Aqua',
            getDescription: () => 'LLAMADO DE EMERGENCIA!',
            image: 'https://i.ibb.co/tT84Vk5P/Bodoque-cantando-llamado-de-emergencia.gif'
        },
        audioFile: 'Bodoque cantando llamado de emergencia.mp3',
        requiresVoice: false,
        audioRequiresVoice: true,
        aliases: ['llamadodeemergencia']
    },
    flashbang: {
        embedConfig: {
            title: 'FLASHH!!!',
            color: 'Aqua',
            getDescription: () => 'FLASH!',
            image: 'https://i.ibb.co/pjy2Yr7x/flashbang-meme.gif'
        },
        audioFile: 'Flashbang - Counter Strike 2 - Sound Effect (CS2 Game SFX).mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    coverme: {
        embedConfig: {
            title: 'COVER ME!!!',
            color: 'Aqua',
            getDescription: () => 'COVER ME!!!',
            image: 'https://i.ibb.co/sp3Xn2t6/image.png'
        },
        audioFile: 'Counter Strike   Cover me!.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    theone: {
        embedConfig: {
            title: 'Te la toco de primera!!!',
            color: 'Aqua',
            getDescription: () => '👯‍♂️👯‍♀️!!!',
            image: 'https://i.ibb.co/5hm3QFGz/Davo-xeneise-bailando-toc-y-me-voy-para-tus-plantillas.gif'
        },
        audioFile: 'Davo xeneise bailando tocó y me voy, para tus plantillas..mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    estupidinizador: {
        embedConfig: {
            title: 'ESTUPIDINIZADOR',
            color: 'Aqua',
            getDescription: () => 'ESTUPIDINIZADOR-INADOR',
            image: 'https://i.ibb.co/9mty8n57/orb-of-confusion-spongebob.gif'
        },
        audioFile: 'Orbe de confusión.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    },
    brains: {
        embedConfig: {
            title: 'BRAINZZZZZ',
            color: 'Aqua',
            getDescription: () => 'BRAINZZZZZZ',
            image: 'https://i.ibb.co/0psQQTtn/Plants-Vs-Zombies-Copy-q-TEU7z-HTr-G-1.gif'
        },
        audioFile: 'Voicy_The Zombies are coming.mp3',
        requiresVoice: false,
        audioRequiresVoice: true
    }
};

// Función helper para crear y enviar embeds
const createAndSendEmbed = (message, config, args) => {
    const embed = new EmbedBuilder()
        .setTitle(config.title)
        .setColor(config.color || 'Default')
        .setDescription(config.getDescription ? config.getDescription(args) : config.description);

    if (config.image) {
        embed.setImage(config.image);
    } else if (config.images) {
        const randomImage = config.images[Math.floor(Math.random() * config.images.length)];
        embed.setImage(randomImage);
    }

    const messageOptions = { embeds: [embed] };
    
    if (config.components) {
        messageOptions.components = config.components;
    }

    return message.reply(messageOptions);
};

// Modificamos el sistema de cola de reproducción
const audioQueue = {
    isPlaying: false,
    queue: [],
    currentConnection: null,
    currentPlayer: null,
    currentProcesses: [],

    async processQueue() {
        if (this.isPlaying || this.queue.length === 0) {
            console.log('Cola no procesada:', this.isPlaying ? 'Ya reproduciendo' : 'Cola vacía');
            return;
        }
        
        this.isPlaying = true;
        const queueItem = this.queue.shift();
        const { interaction, audioFile, music } = queueItem;
        const itemName = music ? music.title : audioFile;
        console.log(`Procesando audio: ${itemName}`);
        
        try {
            if (!interaction.member.voice.channel) {
                console.log('Usuario no está en un canal de voz');
                this.cleanup(false);
                return;
            }

            const channel = interaction.member.voice.channel;
            console.log(`Canal de voz detectado: ${channel.name} (${channel.id}) en guild ${channel.guild.id}`);
            
            // Verificamos si ya existe una conexión y la limpiamos
            if (this.currentConnection) {
                try {
                    this.currentConnection.destroy();
                } catch (error) {
                    console.log('Conexión previa ya destruida');
                }
                this.currentConnection = null;
            }

            this.currentConnection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
            });

            // Manejamos la desconexión manual
            this.currentConnection.on('stateChange', async (oldState, newState) => {
                console.log(`Estado voz: ${oldState.status} -> ${newState.status}`);

                if (newState.status === VoiceConnectionStatus.Disconnected) {
                    console.log('Conexión desconectada, intentando reconectar...');
                    try {
                        await Promise.race([
                            entersState(this.currentConnection, VoiceConnectionStatus.Signalling, 5000),
                            entersState(this.currentConnection, VoiceConnectionStatus.Connecting, 5000),
                        ]);
                    } catch (error) {
                        console.log('No se pudo reconectar la voz, limpiando conexión');
                        this.cleanup(true);
                    }
                } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                    console.log('Conexión destruida');
                }
            });

            console.log('Esperando conexión de voz Ready...');
            await entersState(this.currentConnection, VoiceConnectionStatus.Ready, 30000);
            console.log('Conexión de voz lista.');

            this.currentPlayer = createAudioPlayer();
            let ffmpeg;

            if (music) {
                console.log(`Intentando reproducir música: ${music.input}`);
                const ytdlp = spawn(ytdlpBin, [
                    ...getYtdlpSharedArgs(),
                    '--no-playlist',
                    '-f', 'bestaudio/best',
                    '-o', '-',
                    music.input
                ], {
                    stdio: ['ignore', 'pipe', 'pipe']
                });

                this.currentProcesses.push(ytdlp);

                ytdlp.stderr.on('data', (data) => {
                    const msg = data.toString().trim();
                    if (msg) {
                        console.log(`[yt-dlp] ${msg}`);
                    }
                });

                ytdlp.on('error', (error) => {
                    console.error('Error del proceso yt-dlp:', error.message);
                });

                ytdlp.on('close', (code, signal) => {
                    this.currentProcesses = this.currentProcesses.filter(process => process !== ytdlp);
                    if (code !== 0 && code !== null) {
                        console.error(`yt-dlp terminó con código ${code}${signal ? ` (${signal})` : ''}`);
                    }
                });

                ffmpeg = spawn(ffmpegBin, [
                    '-hide_banner',
                    '-loglevel', 'warning',
                    '-nostdin',
                    '-i', 'pipe:0',
                    '-vn',
                    '-f', 'ogg',
                    '-c:a', 'libopus',
                    '-b:a', '128k',
                    '-ar', '48000',
                    'pipe:1'
                ], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                ytdlp.stdout.pipe(ffmpeg.stdin);
            } else {
                const filePath = resolveAudioFile(audioFile);
                
                console.log(`Intentando reproducir: ${filePath}`);
                
                if (!fs.existsSync(filePath)) {
                    throw new Error(`Archivo de audio no encontrado: ${filePath}`);
                }

                // Usar ffmpeg con salida en Ogg/Opus
                ffmpeg = spawn(ffmpegBin, [
                    '-hide_banner',
                    '-loglevel', 'warning',
                    '-nostdin',
                    '-i', filePath,
                    '-vn',
                    '-f', 'ogg',
                    '-c:a', 'libopus',
                    '-b:a', '128k',
                    '-ar', '48000',
                    'pipe:1'
                ], {
                    stdio: ['ignore', 'pipe', 'pipe']
                });
            }

            this.currentProcesses.push(ffmpeg);

            ffmpeg.stderr.on('data', (data) => {
                const msg = data.toString().trim();
                if (msg && !msg.includes('Press [q]')) {
                    console.log(`[FFmpeg] ${msg}`);
                }
            });

            ffmpeg.on('error', (error) => {
                console.error(`❌ Error del proceso ffmpeg:`, error.message);
            });

            ffmpeg.on('close', (code, signal) => {
                this.currentProcesses = this.currentProcesses.filter(process => process !== ffmpeg);
                if (code !== 0) {
                    console.error(`FFmpeg terminó con código ${code}${signal ? ` (${signal})` : ''}`);
                }
            });

            const resource = createAudioResource(ffmpeg.stdout, {
                inputType: StreamType.OggOpus,
            });
            
            this.currentConnection.subscribe(this.currentPlayer);
            this.currentPlayer.play(resource);
            
            console.log(`Audio iniciando: ${itemName}`);

            return new Promise((resolve) => {
                this.currentPlayer.on(AudioPlayerStatus.Idle, () => {
                    console.log(`✓ Audio terminado: ${itemName}`);
                    this.cleanup(true);
                    resolve();
                });

                this.currentPlayer.on('error', error => {
                    console.error(`✗ Error reproduciendo ${itemName}:`, error.message);
                    this.cleanup(true);
                    resolve();
                });

                this.currentPlayer.on(AudioPlayerStatus.Playing, () => {
                    console.log(`▶ Reproduciendo: ${itemName}`);
                });

                setTimeout(() => {
                    if (this.isPlaying) {
                        console.log(`⏱ Timeout de seguridad activado para: ${itemName}`);
                        this.cleanup(true);
                        resolve();
                    }
                }, queueItem.timeoutMs || 30000);
            });
        } catch (error) {
            console.error('Error procesando cola de audio:', error);
            this.cleanup(false);
        }
    },

    cleanup(destroyConnection = true) {
        try {
            if (this.currentPlayer) {
                try {
                    this.currentPlayer.stop();
                } catch (error) {
                    console.log('Error al detener el reproductor:', error);
                }
                this.currentPlayer = null;
            }

            this.currentProcesses.forEach(process => {
                try {
                    process.kill('SIGKILL');
                } catch (error) {
                    console.log('Error al detener proceso de audio:', error);
                }
            });
            this.currentProcesses = [];

            if (this.currentConnection && destroyConnection) {
                try {
                    this.currentConnection.destroy();
                } catch (error) {
                    console.log('Error al destruir la conexión:', error);
                }
                this.currentConnection = null;
            }
        } catch (error) {
            console.log('Error en cleanup:', error);
        } finally {
            this.isPlaying = false;
            this.processQueue();
        }
    },
    
    addToQueue(interaction, audioFile) {
        console.log(`Agregando a la cola: ${audioFile}`);
        this.queue.push({ interaction, audioFile });
        this.processQueue().catch(error => {
            console.error('Error en processQueue:', error);
            this.cleanup();
        });
    },

    addMusicToQueue(interaction, music) {
        console.log(`Agregando música a la cola: ${music.title}`);
        this.queue.push({ interaction, music, timeoutMs: MUSIC_TIMEOUT_MS });
        this.processQueue().catch(error => {
            console.error('Error en processQueue:', error);
            this.cleanup();
        });
    },

    stopAll() {
        this.queue = [];
        this.cleanup(true);
    }
};

// Modificamos la función playAudio para manejar mejor los errores
const playAudio = async (interaction, audioFile) => {
    try {
        if (!interaction.member.voice.channel) {
            console.log('Usuario no está en un canal de voz');
            return false;
        }
        audioQueue.addToQueue(interaction, audioFile);
        return true;
    } catch (error) {
        console.error('Error en playAudio:', error);
        return false;
    }
};

const playMusic = async (interaction, query) => {
    try {
        if (!interaction.member.voice.channel) {
            return {
                ok: false,
                message: 'Necesitas estar en un canal de voz para reproducir música.'
            };
        }

        const music = await resolveMusicSource(query);
        audioQueue.addMusicToQueue(interaction, music);

        return {
            ok: true,
            message: `Agregada a la cola: ${music.title}`
        };
    } catch (error) {
        console.error('Error en playMusic:', error);
        return {
            ok: false,
            message: `No pude preparar esa música: ${error.message}`
        };
    }
};

// Refactorización de commands
const commands = {};

// Generamos dinámicamente los comandos basados en la configuración
Object.entries(commandConfig).forEach(([commandName, config]) => {
    commands[commandName] = async (message, args) => {
        if (config.requiresVoice && !message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        // Enviamos el embed
        await createAndSendEmbed(message, config.embedConfig, args);

        // Reproducimos el audio solo si:
        // 1. Tiene archivo de audio
        // 2. El usuario está en un canal de voz O el audio no requiere voz
        if (config.audioFile && 
            (!config.audioRequiresVoice || message.member.voice.channel)) {
            await playAudio(message, config.audioFile);
        }
    };
});

commands.play = async (message, args) => {
    const query = args.join(' ').trim();
    if (!query) {
        return message.reply('Usa `&play <link de YouTube/Spotify o nombre de canción>`.');
    }

    const loadingMessage = await message.reply('Buscando música...');
    const result = await playMusic(message, query);
    return loadingMessage.edit(result.message);
};

commands.stop = async (message) => {
    audioQueue.stopAll();
    return message.reply('Reproducción detenida y cola vaciada.');
};

const COOLDOWN_DURATION = 5000;
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('&')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Buscar el comando principal si es un alias
    let mainCommand = command;
    for (const [cmdName, cmdConfig] of Object.entries(commandConfig)) {
        if (cmdConfig.aliases && cmdConfig.aliases.includes(command)) {
            mainCommand = cmdName;
            break;
        }
    }

    if (!cooldowns.has(mainCommand)) {
        cooldowns.set(mainCommand, new Collection());
    }

    const timeLeft = commandCoolDown(message.author.id, mainCommand, COOLDOWN_DURATION);
    if (timeLeft) {
        return message.reply(`Por favor espera ${timeLeft.toFixed(1)} segundo(s) más antes de reusar el comando \`${mainCommand}\`.`);
    }

    if (commands[mainCommand]) {
        commands[mainCommand](message, args);
    } else {
        message.reply("NO SEA MULA, NO EXISTE.");
    }
});

// Crear los comandos slash
const slashCommands = [];

Object.entries(commandConfig).forEach(([commandName, config]) => {
    // Crear el comando principal
    const command = new SlashCommandBuilder()
        .setName(commandName)
        .setDescription(`Comando ${commandName}`);

    // Agregar opciones de texto si el comando las necesita
    if (config.embedConfig.getDescription) {
        command.addStringOption(option =>
            option.setName('texto')
                .setDescription('Texto adicional para el comando')
                .setRequired(false)
        );
    }

    slashCommands.push(command.toJSON());

    // Agregar los aliases como comandos separados
    if (config.aliases) {
        config.aliases.forEach(alias => {
            const aliasCommand = new SlashCommandBuilder()
                .setName(alias)
                .setDescription(`Alias para el comando ${commandName}`);

            // Agregar las mismas opciones que el comando principal
            if (config.embedConfig.getDescription) {
                aliasCommand.addStringOption(option =>
                    option.setName('texto')
                        .setDescription('Texto adicional para el comando')
                        .setRequired(false)
                );
            }

            slashCommands.push(aliasCommand.toJSON());
        });
    }
});

slashCommands.push(
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce música desde YouTube, Spotify o una búsqueda')
        .addStringOption(option =>
            option.setName('busqueda')
                .setDescription('Link de YouTube/Spotify o nombre de canción')
                .setRequired(true)
        )
        .toJSON()
);

slashCommands.push(
    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Detiene la reproducción y vacía la cola')
        .toJSON()
);

// Registrar los comandos slash
const rest = new REST({ version: '10' }).setToken(config.Token);
const guildId = process.env.GUILD_ID || config.GuildId;

https.get('https://discord.com/api/v10', (res) => {
    console.log('Status code Discord API:', res.statusCode);
}).on('error', (e) => {
    console.error('Error conectando a Discord API:', e);
});

(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos

    try {
        console.log('Token:', config.Token ? 'OK' : 'NO TOKEN');
        console.log('ClientId:', config.ClientId);
        console.log('Intentando registrar comandos slash...');
        console.log('Comenzando a registrar los comandos slash...');

        console.log(`Registrando ${slashCommands.length} comandos: ${slashCommands.map(command => command.name).join(', ')}`);

        if (guildId) {
            console.log(`Registrando comandos slash en guild: ${guildId}`);
            await rest.put(
                Routes.applicationGuildCommands(config.ClientId, guildId),
                { body: slashCommands, signal: controller.signal },
            );
        } else {
            console.log('Registrando comandos slash globales');
            await rest.put(
                Routes.applicationCommands(config.ClientId),
                { body: slashCommands, signal: controller.signal },
            );
        }

        clearTimeout(timeout);
        console.log('¡Comandos slash registrados exitosamente!');
    } catch (error) {
        clearTimeout(timeout);
        console.error('Error al registrar los comandos slash:', error);
    }
})();

// Manejar los comandos slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const commandName = interaction.commandName;

    if (commandName === 'play') {
        const query = interaction.options.getString('busqueda');
        await interaction.deferReply();
        const result = await playMusic(interaction, query);
        return interaction.editReply(result.message);
    }

    if (commandName === 'stop') {
        audioQueue.stopAll();
        return interaction.reply('Reproducción detenida y cola vaciada.');
    }
    
    // Buscar el comando principal si es un alias
    let mainCommand = commandName;
    for (const [cmdName, cmdConfig] of Object.entries(commandConfig)) {
        if (cmdConfig.aliases && cmdConfig.aliases.includes(commandName)) {
            mainCommand = cmdName;
            break;
        }
    }

    const config = commandConfig[mainCommand];

    if (!config) {
        return interaction.reply({ content: "NO SEA MULA, NO EXISTE.", ephemeral: true });
    }

    // Verificar cooldown
    if (!cooldowns.has(mainCommand)) {
        cooldowns.set(mainCommand, new Collection());
    }

    const timeLeft = commandCoolDown(interaction.user.id, mainCommand, COOLDOWN_DURATION);
    if (timeLeft) {
        return interaction.reply({ 
            content: `Por favor espera ${timeLeft.toFixed(1)} segundo(s) más antes de reusar el comando \`${mainCommand}\`.`,
            ephemeral: true 
        });
    }

    // Verificar si requiere canal de voz
    if (config.requiresVoice && !interaction.member.voice.channel) {
        return interaction.reply({ 
            content: 'Necesitas estar en un canal de voz para usar este comando.',
            ephemeral: true 
        });
    }

    // Obtener argumentos del comando slash
    const args = [];
    if (interaction.options.getString('texto')) {
        args.push(interaction.options.getString('texto'));
    }

    // Crear y enviar el embed
    const embed = new EmbedBuilder()
        .setTitle(config.embedConfig.title)
        .setColor(config.embedConfig.color || 'Default')
        .setDescription(config.embedConfig.getDescription ? config.embedConfig.getDescription(args) : config.embedConfig.description);

    if (config.embedConfig.image) {
        embed.setImage(config.embedConfig.image);
    } else if (config.embedConfig.images) {
        const randomImage = config.embedConfig.images[Math.floor(Math.random() * config.embedConfig.images.length)];
        embed.setImage(randomImage);
    }

    const messageOptions = { embeds: [embed] };
    
    if (config.embedConfig.components) {
        messageOptions.components = config.embedConfig.components;
    }

    await interaction.reply({ embeds: [embed] });
    if (config.audioFile && 
        (!config.audioRequiresVoice || interaction.member.voice.channel)) {
        await playAudio(interaction, config.audioFile);
    }
});

client.login(config.Token);
