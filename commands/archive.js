const fs = require('fs');

function viewArchive(message) {
    //.viewarchive / .varc
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only Head Admins can use this command!');
        return;
    }
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    var response = "**__Archived series__:**\n";
    var archivedSeries = metadata.filter(card => card.isArchived);// fillter cards that have been archived
    //remove dupelicate archived series
    archivedSeries = [...new Set(archivedSeries.map(card => card.series))];
    response += `\`${archivedSeries.join('\n')}\``;
    message.channel.send(response);
}
function archive(message, series) {
    //.archive / .arc
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only Head Admins can use this command!');
        return;
    }
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    // Set isArchived to true for all cards in the series
    metadata.forEach(card => {
        if (card.series === series) {
            card.isArchived = true;
        }
    });

    // Save updated metadata back to file
    fs.writeFileSync('./cards/metadata.json', JSON.stringify(metadata, null, 4));
    message.channel.send(`Series "${series}" has been archived.`);
}
function unarchive(message, series) {
    //.unarchive / .unarc
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only Head Admins can use this command!');
        return;
    }
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    // Set isArchived to false for all cards in the series
    metadata.forEach(card => {
        if (card.series === series) {
            card.isArchived = false;
        }
    });

    // Save updated metadata back to file
    fs.writeFileSync('./cards/metadata.json', JSON.stringify(metadata, null, 4));
    message.channel.send(`Series "${series}" has been unarchived.`);
}


module.exports = {
    viewArchive,
    archive,
    unarchive
}