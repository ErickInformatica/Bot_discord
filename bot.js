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
        .setImage('https://media.giphy.com/media/dIBzteMy7M5H6iy7CX/giphy.gif')

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