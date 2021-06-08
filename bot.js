const Discord = require("discord.js");
const config = require("./auth.json");

const client = new Discord.Client();
const prefix = "&";
var tokenUser = '';

client.on("message", function (message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();
    if (command === "esta") {
        const embed = new Discord.MessageEmbed()
        .setTitle('PARA EL PUTO')
        .setColor('RED')
        .setDescription(`Esta .l. para el puto ${args.join(' ')}!`)
        

        var numRandom = Math.floor(Math.random() * 6) + 1;
        switch (numRandom) {
            case 1:
                embed.setImage('https://i.ibb.co/QnjTL6B/trash-finger.gif')
                break;
            case 2:
                embed.setImage('https://i.ibb.co/NjWrVqY/infinite-finger.gif')
                break;
            case 3:
                embed.setImage('https://i.ibb.co/wgp0r35/circles-finger.gif')
                break;
            case 4:
                embed.setImage('https://i.ibb.co/DRtS3BS/camisa-finger.gif')
                break;
            case 5:
                embed.setImage('https://i.ibb.co/n3vBqWZ/arrow-finger.gif')
                break;
            case 6:
                embed.setImage('https://i.ibb.co/mNy3rND/kid-finger.gif')
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
        const embed = new Discord.MessageEmbed()
        .setTitle('ME ESTA PICOTEANDO')
        .setColor('AQUA')
        .setDescription(`Vean banda me esta picoteando, ${args.join(' ')}! AHHH!! PUTO!! SUELTAME ALV!!`)
        .setImage('https://i.ibb.co/cJhDGyN/picoteando.gif')

        message.reply(embed);
    } else if(command === "vaca"){
        // client.token = tokenUser;

        // const fetchUser = async id => client.users.fetch(id);
        const channelName = "pedir-musica";
        const channel = client.channels.cache.find(channel => channel.name === channelName)
        channel.send('-p vaca')
    }
});

client.login(config.Token)