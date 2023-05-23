const Discord = require("discord.js");
const config = require("./auth.json");
const path = require("path");

const cooldowns = new Discord.Collection();

const client = new Discord.Client();
const prefix = "&";
var tokenUser = '';

const commandCoolDown = (userId, message) => {
    if (cooldowns.has(userId)) {
        const cooldown = cooldowns.get(userId);

        // Calculate the remaining time until the cooldown expires
        const remainingTime = cooldown - Date.now();

        // Check if the cooldown is still active
        if (remainingTime > 0) {
            // Cooldown is still active
            return message.reply(`Espera ${Math.ceil(remainingTime / 1000)} sec, mamawuevo para usar el comando.`);
        }
    }

    // Set the cooldown duration (in milliseconds)
      const cooldownDuration = 5000; // 5 seconds

      // Set the cooldown expiration time
      const expirationTime = Date.now() + cooldownDuration;

      // Add the cooldown information to the collection
      cooldowns.set(userId, expirationTime);

      // Your command logic goes here
      message.reply('Command executed.');

      // Remove the cooldown after the specified duration
      setTimeout(() => {
        cooldowns.delete(userId);
      }, cooldownDuration);
} 

client.on("message", function (message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const userId = message.author.id;
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    if (command === "esta") {
        const embed = new Discord.MessageEmbed()
        .setTitle('PARA EL PUTO')
        .setColor('RED')
        .setDescription(`Esta .l. para el puto ${args.join(' ')}!`)
        

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

        message.reply(embed);
    } else if (command === "random") {
        var numRandom = Math.floor(Math.random() * 3) + 1;
        switch (numRandom) {
            case 1:
                message.reply("Esta .l. para el puto @ElCalichin !");
                break;
            case 2:
                message.reply(`Esta .l. para el puto @Kevin Little :v !`);
                break;
            case 3:
                message.reply(`Esta .l. para el puto @Kansas !`);
                break;
        }
    } else if(command === "picoteando") {
        commandCoolDown(userId, message);

        const embed = new Discord.MessageEmbed()
        .setTitle('ME ESTA PICOTEANDO')
        .setColor('AQUA')
        .setDescription(`Vean banda me esta picoteando, ${args.join(' ')}! AHHH!! PUTO!! SUELTAME ALV!!`)
        .setImage('https://i.ibb.co/cJhDGyN/picoteando.gif')

        message.reply(embed);
        var isReady = true;
        if (isReady){
            isReady = false;
            if(message.member.voice.channel){
                var voiceChannel = message.member.voice;
                voiceChannel.channel.join().then(connection =>
                {
                   const dispatcher = connection.play(path.join(__dirname, 'me-esta-picando-banda.m4a'));
                   dispatcher.on("finish", end => {
                     voiceChannel.channel.leave();
                     });
                 }).catch(err => console.log(err));
                             
            }
            isReady = true;
        }
    } else if (command === "adiosito"){
        const embed = new Discord.MessageEmbed()
        .setTitle('BESOS, BESITOS, BESOS')
        .setColor('RED')
        .setDescription(`VAMONOS ALV ${args.join(' ')}!`)
        .setImage('https://i.ibb.co/LhHDhqG/Webp-net-gifmaker.gif')
        message.reply(embed);
        var isReady = true;
        if (isReady){
            isReady = false;
            if(message.member.voice.channel){
                var voiceChannel = message.member.voice;
                voiceChannel.channel.join().then(connection =>
                {
                   const dispatcher = connection.play(path.join(__dirname, 'kevin-audio.m4a'));
                   dispatcher.on("finish", end => {
                     voiceChannel.channel.leave();
                     });
                 }).catch(err => console.log(err));
                             
            }
            isReady = true;
        }
            
    } else if (command === "ñam"){
        const embed = new Discord.MessageEmbed()
        .setTitle('A COMER PUERCAS!!!')
        .setColor('RED')
        .setDescription(`ÑAÑAÑAÑAÑAÑAÑAÑAÑAÑA`)
        .setImage('https://i.ibb.co/zZkStgV/nanana.gif')
        message.reply(embed);
        var isReady = true;
        if (isReady){
            isReady = false;
            if(message.member.voice.channel){
                var voiceChannel = message.member.voice;
                voiceChannel.channel.join().then(connection =>
                {
                   const dispatcher = connection.play(path.join(__dirname, 'calichin.m4a'));
                   dispatcher.on("finish", end => {
                     voiceChannel.channel.leave();
                     });
                 }).catch(err => console.log(err));
                             
            }
            isReady = true;
        }
    }else if (command === "kansas"){
        const embed = new Discord.MessageEmbed()
        .setTitle('SOY GAY SOY GAY Y NO TIENE NADA DE MALO')
        .setColor([221, 51, 255])
        .setDescription(`FORTINAITI`)
        .setUrl('https://www.youtube.com/watch?v=h3Bcjy0l6Yw')
        message.reply(embed);
        var isReady = true;
        if (isReady){
            isReady = false;
            if(message.member.voice.channel){
                var voiceChannel = message.member.voice;
                voiceChannel.channel.join().then(connection =>
                {
                   const dispatcher = connection.play(path.join(__dirname, 'soy-gay-y-no-tiene-nada-de-malo.m4a'));
                   dispatcher.on("finish", end => {
                     voiceChannel.channel.leave();
                     });
                 }).catch(err => console.log(err));
                             
            }
            isReady = true;
        }
    }else if (command === "yip"){
        const embed = new Discord.MessageEmbed()
        .setTitle('ASDFASGADSFKAJSDHFKJALSDFHASLDF')
        .setColor('RED')
        .setDescription(`ASI COMO LO OYERON PUTOS`)
        .setImage('https://i.ibb.co/n8Kknsb/nigel-thornberry-kid.gif')
        message.reply(embed);
        var isReady = true;
        if (isReady){
            isReady = false;
            if(message.member.voice.channel){
                var voiceChannel = message.member.voice;
                voiceChannel.channel.join().then(connection =>
                {
                   const dispatcher = connection.play(path.join(__dirname, 'kansas.m4a'));
                   dispatcher.on("finish", end => {
                     voiceChannel.channel.leave();
                     });
                 }).catch(err => console.log(err));
                             
            }
            isReady = true;
        }
    } else if(command === "enviar mensaje"){
        // client.token = tokenUser;

        // const fetchUser = async id => client.users.fetch(id);
        const channelName = "pedir-musica";
        const channel = client.channels.cache.find(channel => channel.name === channelName)
        channel.send('/play vaca')
    }
});

client.login(config.Token)