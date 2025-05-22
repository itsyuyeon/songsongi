const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

async function balance(message) {
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const embed = new EmbedBuilder()
        .setColor("#F9768C")
        .setTitle(`${message.author.username}'s Balance`)
        .addFields(
            { name: "Syncbank:", value: `${userData.syncbank}`, inline: true },
            { name: "Wallet:", value: `${userData.wallet}`, inline: true }
        )
    message.channel.send({ embeds: [embed] });    
}

module.exports = {
    balance
};