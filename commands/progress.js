const fs = require('fs');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const db = require('../db');

const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
if (result.rows.length === 0) {
    // User not found, handle accordingly
    console.error('User not found in the database');
    return;
}

async function progress(message, group) {
    let colour = "#98b6f6";
    if (group.startsWith('LTE')) {
        colour = "#b40202";
    }

    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));

    // Filter cards based on group keyword match
    const groupPattern = new RegExp(group, 'i');
    const matchedCards = metadata.filter(card => 
        groupPattern.test(card.code) || 
        groupPattern.test(card.rarity) || 
        groupPattern.test(card.group) || 
        groupPattern.test(card.era) || 
        groupPattern.test(card.idolname) || 
        groupPattern.test(card.series)
    );

    const totalCards = matchedCards.length;
    const collectedCards = matchedCards.filter(card => userData.cards.some(userCard => userCard.code === card.code)).length;

    const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Progress`)
        .setDescription(`__You have collected ${collectedCards} out of ${totalCards} cards__`)
        .setColor(colour)
        .setFooter({ text: `You’ve reached ${Math.round(collectedCards / totalCards * 100)}% completion` });

    // Organize by group and display missing cards
    const groups = {};
    matchedCards.forEach(card => {
        if (!groups[card.group]) {
            groups[card.group] = [];
        }
        groups[card.group].push(card);
    });

    for (const group in groups) {
        const cards = groups[group];
        const missing = cards.filter(card => !userData.cards.some(userCard => userCard.code === card.code));
        const missingNames = missing.map(card => card.name).join(', ') || 'None';
        const missingCodes = missing.map(card => card.code).join(', ') || 'None';

        embed.addFields({
            name: `${group} ${cards.length - missing.length}/${cards.length}`,
            value: `**Missing:** ${missingNames}\n**Codes:** ${missingCodes}`
        });
    }

    const allMissingCodes = Object.values(groups).flatMap(cards =>
        cards.filter(card => !userData.cards.some(userCard => userCard.code === card.code))
    ).map(card => card.code);

    const exportText = allMissingCodes.join('\n') || 'You have collected all cards!';
    const fileName = `missing-cards-${message.author.id}.txt`;
    fs.writeFileSync(`./temp/${fileName}`, exportText);

    const exportButton = new ButtonBuilder()
        .setCustomId('export_missing')
        .setLabel('📄 Export Missing Codes')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(exportButton);

    const reply = await message.reply({
        embeds: [embed],
        components: [row]
    });

    const filter = i => i.customId === 'export_missing' && i.user.id === message.author.id;
    const collector = reply.createMessageComponentCollector({ filter, time: 60000, max: 1 });

    collector.on('collect', async interaction => {
        await interaction.reply({
            content: `Here's your exported list of missing card codes.`,
            files: [`./temp/${fileName}`],
            ephemeral: true
        });

        setTimeout(() => {
            fs.unlink(`./temp/${fileName}`, err => {
                if (err) console.error("Failed to delete temp file:", err);
            });
        }, 10000);
    });
}

module.exports = {
    progress
};
