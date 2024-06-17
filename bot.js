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


const commands = {
    esta: (message, args) => {
        const embed = new EmbedBuilder()
            .setTitle('PARA EL PUTO')
            .setColor('Red')
            .setDescription(`Esta .l. para el puto ${args.join(' ')}!`);
            var numRandom = Math.floor(Math.random() * 11) + 1;
            switch (numRandom) {
                case 1:
                    embed.setImage('https://i.ibb.co/QnjTL6B/trash-finger.gif')
                    break;
                case 2:
                    embed.setImage('https://i.ibb.co/MGCn3J9/hat-finger.gif')
                    break;
                case 3:
                    embed.setImage('https://i.ibb.co/JQ90Rjv/hail-finger.gif')
                    break;
                case 4:
                    embed.setImage('https://i.ibb.co/zPLZrjj/pichu-finger.gif')
                    break;
                case 5:
                    embed.setImage('https://i.ibb.co/r2bxg7J/window-finger.gif')
                    break;
                case 6:
                    embed.setImage('https://i.ibb.co/mNy3rND/kid-finger.gif')
                    break;
                case 7:
                    embed.setImage('https://i.ibb.co/vX8sN44/girl-finger.gif')
                    break;
                case 8:
                    embed.setImage('https://i.ibb.co/tQXqSLD/feet-finger.gif')
                    break;
                case 9:
                    embed.setImage('https://i.ibb.co/mcv1Yr8/happykid-finger.gif')
                    break;
                case 10:
                    embed.setImage('https://i.ibb.co/VxGq8p4/baby-finger.gif')
                    break;
                case 11:
                    embed.setImage('https://i.ibb.co/HpFRvTX/horse-finger.gif')
                    break;
            }
        message.reply({ embeds: [embed] });
    },
    picoteando: async (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('ME ESTA PICOTEANDO')
            .setColor('Aqua')
            .setDescription(`Vean banda me esta picoteando, ${args.join(' ')}! AHHH!! PUTO!! SUELTAME ALV!!`)
            .setImage('https://i.ibb.co/cJhDGyN/picoteando.gif');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'me-esta-picando-banda.m4a'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    adiosito: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('BESOS, BESITOS, BESOS')
            .setColor('Red')
            .setDescription(`VAMONOS ALV ${args.join(' ')}!`)
            .setImage('https://i.ibb.co/LhHDhqG/Webp-net-gifmaker.gif')
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'kevin-audio.m4a'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    'ñam': (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('A COMER PUERCAS!!!')
            .setColor('Red')
            .setDescription(`ÑAÑAÑAÑAÑAÑAÑAÑAÑAÑA`)
            .setImage('https://i.ibb.co/zZkStgV/nanana.gif')
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'calichin.m4a'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    kansas: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Ere Gay?')
                .setStyle(ButtonStyle.Link)
                .setURL('https://www.youtube.com/watch?v=h3Bcjy0l6Yw')
        );
    
        const embed = new EmbedBuilder()
            .setTitle('SOY GAY SOY GAY Y NO TIENE NADA DE MALO')
            .setDescription('FORTINAITI!!!');
        
        message.reply({ embeds: [embed], components: [row] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'soy-gay-y-no-tiene-nada-de-malo.m4a'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    yip: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('ASDFASGADSFKAJSDHFKJALSDFHASLDF')
            .setColor('Red')
            .setDescription(`ASI COMO LO OYERON PUTOS`)
            .setImage('https://i.ibb.co/n8Kknsb/nigel-thornberry-kid.gif')
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'kansas.m4a'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    pozole: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('WORT WORT WORT')
            .setColor('Aqua')
            .setDescription(`WORT WORT WORT, POZOLE?`)
            .setImage('https://i.ibb.co/MSCF5qH/pozole.png');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'pozole-loudess2.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    breach: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('LEEEEETSSS GOOOO!!')
            .setColor('Aqua')
            .setDescription(`LETS GO?`)
            .setImage('https://i.ibb.co/pXS3DvF/image.png');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'Voicy_LETS GO.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    unmedico: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('AYUDAAAA UN MEDICOOOOOOOO')
            .setColor('Aqua')
            .setDescription(`REVIVA ZORRA XD`)
            .setImage('https://i.ibb.co/ChmPC9V/edgar-sage.png');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'SAGE.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    hdp: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('ME VOY A ALIAR CON SIRIA')
            .setColor('Aqua')
            .setDescription(`HIJOS DE PUTAAAAA!`)
            .setImage('https://i.ibb.co/yB1Jw1r/image.png');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'Me voy aliar con siri.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    200: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('DOSCIENTOOOOOOOOOOS')
            .setColor('Aqua')
            .setDescription(`DOSCIENTOOOOOOOOOOS`)
            .setImage('https://i.ibb.co/P9yfkfV/kevinite.png');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, '200.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    bobo: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('ANDA PA ASHA BOBO!')
            .setColor('Aqua')
            .setDescription(`BOBO!`)
            .setImage('https://i.ibb.co/Rj641Tv/image.png');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'gekko.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    barberia: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('PASO LA MUNI')
            .setColor('Aqua')
            .setDescription(`EN LA BARBERIAAAA!`)
            .setImage('https://i.ibb.co/K6z9hxb/barberia.jpg');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'BARBERIA.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    compe: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('VA VEEEEER COMPEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE')
            .setColor('Aqua')
            .setDescription(`PERROS TRIPLE IJUEPUTAS!`)
            .setImage('https://i.ibb.co/zXbVSdF/images-1.jpg');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'COMPE.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    chatarra: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('SE COMPRAAAAA LA CHATARRAAAAA')
            .setColor('Aqua')
            .setDescription(`SE COMPRAAAAA LA CHATARRAAAAA`)
            .setImage('https://i.ibb.co/gmTfm8Q/kevin-sabrozo-removebg-preview.png');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'chatarra.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    mp: (message, args) => {
        if (!message.member.voice.channel) {
            return message.reply('Necesitas estar en un canal de voz para usar este comando.');
        }

        const embed = new EmbedBuilder()
            .setTitle('MP')
            .setColor('Aqua')
            .setDescription(`MANCOS PROMEDIO`)
            .setImage('https://i.ibb.co/dcn0qmb/Imagen-de-Whats-App-2023-12-16-a-las-17-53-12-38ee33c7.jpg');
        
        message.reply({ embeds: [embed] });

        const channel = message.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, 'MP.mp3'));
        
        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            player.stop();
            connection.destroy();
        });

        player.on('error', error => {
            console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
            player.stop();
            connection.destroy();
        });
    },
    woosh: (message, args) => {
        const embed = new EmbedBuilder()
            .setTitle('WOOOOSHHH!! MAMAEGG')
            .setColor('Red')
            .setImage('https://i.ibb.co/pZrXNJX/woosh.jpg');

        message.reply({ embeds: [embed] });
    },
    wooshnt: (message, args) => {
        const embed = new EmbedBuilder()
            .setTitle(`WOOOOSHHHN'T!! BITCH`)
            .setColor('Red')
            .setImage('https://i.ibb.co/cQCJc2D/wooshnt.png');

        message.reply({ embeds: [embed] });
    }
};


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
