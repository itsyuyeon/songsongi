const fs = require('fs');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

async function view(message, cardCode) {
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
    const inventories = JSON.parse(fs.readFileSync(`./data/inventories.json`, 'utf8'));
    const userId = message.author.id;
    const userInventory = inventories[userId] || {};

    // If no cardCode is provided, use lastClaimed
    if (!cardCode) {
        if (!userInventory.lastClaimed) {
            return message.channel.send("You haven’t claimed any cards yet!");
        }
        cardCode = userInventory.lastClaimed;
    }

    const card = metadata.find(c => c.code.toLowerCase() === cardCode.toLowerCase());
    if (!card) {
        return message.channel.send("Card not found!");
    }

    const ownedCount = userInventory[card.code] || 0;

    let colour = "";
    switch (card.rarity) {
        case "3G": colour = "#81b8ff"; break;
        case "4G": colour = "#ffb381"; break;
        case "5G": colour = "#b981ff"; break;
        default:   colour = "#ffffff"; break;
    }

    const cardImage = new AttachmentBuilder(`./cards/${card.code}.png`);
    const embed = new EmbedBuilder()
        .setTitle(card.name)
        .setDescription(`${card.group} - ${card.era}\nRarity: ${card.rarity}\nOwned: ${ownedCount} copies`)
        .setColor(colour)
        .setImage(`attachment://${card.code}.png`)
        .setFooter({ text: `Card Code: ${card.code}` });

    message.reply({ embeds: [embed], files: [cardImage] });
}

module.exports = {
    view,
};
