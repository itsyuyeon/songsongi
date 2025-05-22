const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const { getRandomCards } = require('./drop'); // reuse drop logic if it's exported

const CLAIM_COOLDOWN = 5 * 60 * 1000; // 5 minutes

async function claimCard(message) {
    const userId = message.author.id;
    const filePath = `./inventory/${userId}.json`;

    if (!fs.existsSync(filePath)) {
        return message.reply("❌ You haven't started yet. Use `.start` to begin.");
    }

    const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Ensure cooldown structure
    if (!userData.cooldown) userData.cooldown = {};

    const now = Date.now();
    const lastClaim = userData.cooldown.claim || 0;

    if (lastClaim > now) {
        const remaining = lastClaim - now;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return message.reply(`⏳ You must wait ${minutes}m ${seconds}s before claiming again.`);
    }

    // Load cards and select one
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    const [card] = getRandomCards(metadata, 1);

    // Add card to user inventory
    const existing = userData.cards.find(c => c.code === card.code);
    if (existing) {
        existing.count++;
    } else {
        userData.cards.push({ code: card.code, count: 1 });
    }

    userData.cooldown.claim = now + CLAIM_COOLDOWN;
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

    const colourMap = {
        '3G': '#81b8ff',
        '4G': '#ffb381',
        '5G': '#b981ff',
    };

    const embed = new EmbedBuilder()
        .setColor(colourMap[card.rarity] || '#b981ff')
        .setTitle('📡 Signal Claimed!')
        .setDescription(`You successfully claimed: **${card.code}** - ${card.name}`)
        .setImage(`attachment://${card.code}.png`);

    const imagePath = `./cards/${card.code}.png`;
    if (!fs.existsSync(imagePath)) {
        return message.reply('⚠️ Card image not found.');
    }

    message.reply({ embeds: [embed], files: [imagePath] });
}

module.exports = {
    claimCard
};