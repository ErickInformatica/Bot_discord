const { Client, GatewayIntentBits, EmbedBuilder, VoiceChannel, MessageEmbed, Collection,ActionRowBuilder, ButtonBuilder, ButtonStyle, } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const config = require('./auth.json');
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
        audioRequiresVoice: true
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

// Agregamos un sistema de cola de reproducción
const audioQueue = {
    isPlaying: false,
    queue: [],
    async processQueue() {
        if (this.isPlaying || this.queue.length === 0) return;
        
        this.isPlaying = true;
        const { message, audioFile } = this.queue.shift();
        
        try {
            const channel = message.member.voice.channel;
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(path.join(__dirname, audioFile));
            
            player.play(resource);
            connection.subscribe(player);

            // Esperamos a que termine de reproducirse el audio
            await new Promise((resolve, reject) => {
                player.on(AudioPlayerStatus.Idle, () => {
                    player.stop();
                    connection.destroy();
                    this.isPlaying = false;
                    resolve();
                });

                player.on('error', error => {
                    console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
                    player.stop();
                    connection.destroy();
                    this.isPlaying = false;
                    reject(error);
                });
            });
        } catch (error) {
            console.error('Error processing audio queue:', error);
            this.isPlaying = false;
        }

        // Procesar el siguiente en la cola
        this.processQueue();
    },
    
    addToQueue(message, audioFile) {
        this.queue.push({ message, audioFile });
        this.processQueue();
    }
};

// Modificamos la función playAudio para usar la cola
const playAudio = async (message, audioFile) => {
    if (!message.member.voice.channel) return false;
    audioQueue.addToQueue(message, audioFile);
    return true;
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

const COOLDOWN_DURATION = 5000;
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith('&')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!cooldowns.has(command)) {
        cooldowns.set(command, new Collection());
    }

    const timeLeft = commandCoolDown(message.author.id, command, COOLDOWN_DURATION);
    if (timeLeft) {
        return message.reply(`Por favor espera ${timeLeft.toFixed(1)} segundo(s) más antes de reusar el comando \`${command}\`.`);
    }

    if (commands[command]) {
        commands[command](message, args);
    } else {
        message.reply("NO SEA MULA, NO EXISTE.");
    }
});

client.login(config.Token);
