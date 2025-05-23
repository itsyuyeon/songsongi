import fs from 'fs';
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const db = require('../db');

const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
if (result.rows.length === 0) {
    // User not found, handle accordingly
    console.error('User not found in the database');
    return;
}

async function view(message, arg) {
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));

    let targetUser = message.mentions.users.first() || message.author;
    let userId = targetUser.id;
    let cardCode = arg;

    // If a mention was used, shift argument
    if (message.mentions.users.size > 0) {
        const parts = message.content.split(' ').slice(1); // remove command
        cardCode = parts.find(p => !p.startsWith('<@')) || null;
    }

    const inventoryPath = `./inventory/${userId}.json`;
    if (!fs.existsSync(inventoryPath)) {
        return message.reply(`<@${userId}> doesn’t have any cards yet!`);
    }

    const userInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

    if (!cardCode) {
        if (!userInventory.lastClaimed) {
            return message.reply(`<@${userId}> hasn’t claimed any cards yet!`);
        }
        cardCode = userInventory.lastClaimed;
    }

    const card = metadata.find(c => c.code.toLowerCase() === cardCode.toLowerCase());
    if (!card) {
        return message.reply("Card not found in the metadata.");
    }

    const ownedCard = userInventory.cards.find(c => c.code === card.code);
    const ownedCount = ownedCard?.count || 0;

    const colorMap = {
        "3G": "#81b8ff",
        "4G": "#ffb381",
        "5G": "#b981ff",
        "PRISM": "#ff82d6",
        "LTE": "#b5b5b5"
    };

    const colour = colorMap[card.rarity] || "#ffffff";
    const imagePath = `./cards/${card.code}.png`;
    if (!fs.existsSync(imagePath)) {
        return message.reply("Card image not found.");
    }

    const cardImage = new AttachmentBuilder(imagePath);
    const embed = new EmbedBuilder()
        .setTitle(`${card.name}`)
        .setDescription(`${card.group} - ${card.era}\nRarity: ${card.rarity}\nOwned by ${targetUser.username}: ${ownedCount}x`)
        .setColor(colour)
        .setImage(`attachment://${card.code}.png`)
        .setFooter({ text: `Card Code: ${card.code}` });

    message.reply({ embeds: [embed], files: [cardImage] });
}

module.exports = {
    view
};
