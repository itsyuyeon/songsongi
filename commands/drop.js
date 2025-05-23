const fs = require('fs');
const path = require('path');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

async function paidDrop(message) {
    const userId = message.author.id;
    const userDataPath = `./inventory/${userId}.json`;

    // Load user data
    const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

    // Check wallet
    if (userData.wallet < 250) {
        return message.reply('❌ You do not have enough credits to drop a card.');
    }

    // Deduct credits and increment paid drop counter
    userData.wallet -= 250;
    userData.paidDropCount = (userData.paidDropCount || 0) + 1;

    // Load all metadata
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8')).filter(c => !c.archived);

    // Determine PRISM rate based on pity count
    let prismRate = 10;
    if (userData.paidDropCount >= 15) prismRate = 30;
    if (userData.paidDropCount >= 20) prismRate = 100;

    const rarityWeights = {
        '5G': 30,
        '4G': 50,
        '3G': 70,
        'PRISM': prismRate
    };

    const selectedCard = getRandomCardWithWeights(metadata, rarityWeights);
    
    // Add card to user's inventory
    const index = userData.cards.findIndex(card => card.code === selectedCard.code);
    if (index !== -1) {
        userData.cards[index].count++;
    } else {
        userData.cards.push({ code: selectedCard.code, count: 1 });
    }

    // Reset pity if PRISM
    if (selectedCard.rarity === "PRISM") {
        userData.paidDropCount = 0;
    }

    // Save user data
    fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));

    // Set embed color
    const colorMap = {
        "3G": "#81b8ff",
        "4G": "#ffb381",
        "5G": "#b981ff",
        "PRISM": "#c6deff"
    };
    const colour = colorMap[selectedCard.rarity] || "#b981ff";

    // Send embed with card image
    const imagePath = path.resolve(__dirname, `../cards/${selectedCard.code}.png`);
    const imageAttachment = new AttachmentBuilder(imagePath);

    const embed = new EmbedBuilder()
        .setColor(colour)
        .setTitle('🎴 Paid Card Dropped!')
        .setImage(`attachment://${selectedCard.code}.png`)
        .setDescription(`**Transaction confirmed!** You spent \`250 credits\` <:credits:1357992150457126992> and received Signal Data: \`${selectedCard.code}\`.\n\n💰 **Remaining Balance:** \`${userData.wallet.toLocaleString()}\` credits`);

    message.reply({
        embeds: [embed],
        files: [imageAttachment]
    });
}

// Helper: Get a random card based on weighted rarities
function getRandomCardWithWeights(metadata, weights) {
    let totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
    let rand = Math.random() * totalWeight;
    let cumulative = 0;

    for (let rarity in weights) {
        cumulative += weights[rarity];
        if (rand <= cumulative) {
            const candidates = metadata.filter(card => card.rarity === rarity);
            if (candidates.length > 0) {
                return candidates[Math.floor(Math.random() * candidates.length)];
            }
        }
    }

    // fallback: return random card
    return metadata[Math.floor(Math.random() * metadata.length)];
}

module.exports = {
    drop,
    handleButtonInteraction,
    paidDrop,
};