import fs from 'fs';
const { EmbedBuilder } = require('discord.js');

function boost(message) {
    //check if user is server booster
    var isBooster = (message.member && message.member.premiumSince);
    if (!isBooster) {
        return message.reply("You must be a server booster to use this command.");
    }
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    userData.wallet += 2000;

    const embed = new EmbedBuilder()
        .setTitle("Signal Surge detected!")
        .setColor("#FFEE52")
        .setDescription(
`2000 credits synced to your account.
Thank you for boosting!

-# You currently have ${userData.wallet} credits <:credits:1357992150457126992> in your wallet.`
        )
    message.reply({ embeds: [embed] });
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));
}

export{
    boost,
};