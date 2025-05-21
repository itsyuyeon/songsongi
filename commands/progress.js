const fs = require('fs');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

async function progress(message, group) {
    var colour = "#98b6f6";
    if (group.startsWith('LTE')) {
        colour = "#b40202";
    }
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
    // find matching or simalar text for group in metadata for code, rarity, group, era, idolname, series
    let groupPattern = new RegExp(group, 'i');
    let matchedCards = metadata.filter(card => 
        groupPattern.test(card.code) || 
        groupPattern.test(card.rarity) || 
        groupPattern.test(card.group) || 
        groupPattern.test(card.era) || 
        groupPattern.test(card.idolname) || 
        groupPattern.test(card.series)
    );   

    let totalCards = matchedCards.length;
    let collectedCards = matchedCards.filter(card => userData.cards.some(userCard => userCard.code === card.code)).length;

    const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s progress`)
        .setDescription(`__You have collected ${collectedCards} out of ${totalCards} cards__`)
        .setColor(colour)
        .setFooter({text: `You’ve reached ${Math.round(collectedCards/totalCards*100)}% completion`})
    // sort cards by groups and display each one using embed.addFields
    let groups = {};
    matchedCards.forEach(card => {
        let group = card.group;
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(card);
    });
    
    for (let group in groups) {
        let cards = groups[group];
        let missingCards = cards.filter(card => !userData.cards.some(userCard => userCard.code === card.code));
        var missingCardName = missingCards.map(card => card.name).join(', ');
        var missingCardCode = missingCards.map(card => card.code).join(', ');
        var totalGroupCards = cards.length;
        var collectedGroupCards = totalGroupCards - missingCards.length;

        embed.addFields({ name: `${group} ${collectedGroupCards}/${totalGroupCards}`, value: `**missing:** ${missingCardName}\n**codes:** ${missingCardCode}` });
    }
    
    // Build the text content of all missing codes
    let allMissingCodes = [];
    for (let group in groups) {
        let cards = groups[group];
     let missingCards = cards.filter(card => !userData.cards.some(userCard => userCard.code === card.code));
     missingCards.forEach(card => {
        allMissingCodes.push(card.code);
     });
    }

const exportText = allMissingCodes.join('\n') || 'You have collected all cards!';
const fileName = `missing-cards-${message.author.id}.txt`;
fs.writeFileSync(`./temp/${fileName}`, exportText);

const exportButton = new ButtonBuilder()
    .setCustomId('export_missing')
    .setLabel('📄 Export Missing Codes')
    .setStyle(ButtonStyle.Primary);

const row = new ActionRowBuilder().addComponents(exportButton);

const filter = i => i.customId === 'export_missing' && i.user.id === message.author.id;
const collector = reply.createMessageComponentCollector({ filter, time: 60000, max: 1 });

collector.on('collect', async interaction => {
    // Rebuild the missing code list (same logic)
    let allMissingCodes = [];
    for (let group in groups) {
        let cards = groups[group];
        let missingCards = cards.filter(card => !userData.cards.some(userCard => userCard.code === card.code));
        missingCards.forEach(card => {
            allMissingCodes.push(card.code);
        });
    }

    const exportText = allMissingCodes.join('\n') || 'You have collected all cards!';
    const fileName = `missing-cards-${message.author.id}.txt`;
    fs.writeFileSync(`./temp/${fileName}`, exportText);

    await interaction.reply({
        content: `Here's your exported list of missing card codes.`,
        files: [`./temp/${fileName}`],
        ephemeral: true
    });

    // Optional: Clean up
    setTimeout(() => {
        fs.unlink(`./temp/${fileName}`, err => {
            if (err) console.error("Failed to delete temp file:", err);
        });
    }, 10000);
});


    const reply = await message.reply({
    embeds: [embed],
    components: [row]
});


}

module.exports = {
    progress,
}