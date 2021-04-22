const Discord = require("discord.js");
const config = require("./auth.json");

const client = new Discord.Client();
const prefix = "&";

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
        .setDescription(`Esta .l. para el puto ${args}!`)
        

        var numRandom = Math.floor(Math.random() * 6) + 1;
        switch (numRandom) {
            case 1:
                embed.setImage('https://media.giphy.com/media/dIBzteMy7M5H6iy7CX/giphy.gif')
                break;
            case 2:
                embed.setImage('https://media.giphy.com/media/XHr6LfW6SmFa0/source.gif')
                break;
            case 3:
                embed.setImage('https://media.giphy.com/media/3ofT5VKbcCMGMoHULm/source.mp4')
                break;
            case 4:
                embed.setImage('https://media.giphy.com/media/VAYuDQ8ZFYTFC/source.gif')
                break;
            case 5:
                embed.setImage('https://media.giphy.com/media/QGzPdYCcBbbZm/source.gif')
                break;
            case 6:
                embed.setImage('https://media.giphy.com/media/7jtgsCQRfZKN2/source.gif')
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
    }
});

client.login(config.Token)