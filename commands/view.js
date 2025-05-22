const fs = require('fs');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

async function view(message, arg1, arg2) {
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));

    let targetUser = message.author;
    let cardCode = arg1;

    // Check if the first argument is a user mention
    const mention = message.mentions.users.first();
    if (mention) {
        targetUser = mention;
        cardCode = arg2 || null;
    }

    const userId = targetUser.id;
    const inventoryPath = `./inventory/${userId}.json`;

    if (!fs.existsSync(inventoryPath)) {
        return message.channel.send(`<@${userId}> has no inventory data.`);
    }

    const userInventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

    // If no cardCode is provided, use lastClaimed
    if (!cardCode) {
        if (!userInventory.lastClaimed) {
            return message.channel.send(`<@${userId}> hasn’t claimed any cards yet!`);
        }
        cardCode = userInventory.lastClaimed;
    }

    const card = metadata.find(c => c.code.toLowerCase() === cardCode.toLowerCase());
    if (!card) {
        return message.channel.send("Card not found in metadata!");
    }

    const ownedCard = userInventory.cards.find(c => c.code === card.code);
    const ownedCount = ownedCard ? ownedCard.count : 0;

    let colour = "#ffffff";
    if (card.rarity === "3G") colour = "#81b8ff";
    if (card.rarity === "4G") colour = "#ffb381";
    if (card.rarity === "5G") colour = "#b981ff";
    if (card.rarity === "PRISM") colour = "#ffe352";

    const cardImage = new AttachmentBuilder(`./cards/${card.code}.png`);
    const embed = new EmbedBuilder()
        .setTitle(card.name)
        .setDescription(`**Group:** ${card.group}\n**Era:** ${card.era}\n**Rarity:** ${card.rarity}\n**Owned:** ${ownedCount} copies`)
        .setColor(colour)
        .setImage(`attachment://${card.code}.png`)
        .setFooter({ text: `Card Code: ${card.code}` });

    message.reply({ embeds: [embed], files: [cardImage] });
}

module.exports = {
    view,
};
