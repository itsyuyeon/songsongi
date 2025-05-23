const fs = require('fs');

function warn(message, userId) {
    if (!message.member.roles.cache.some(role => role.name === "head admin" || role.name === "investigator")) {
        message.reply('You are not allowed to use this!');
        return;
    }
    // Check if the user is a bot
    if (message.mentions.users.first().bot) {
        return message.channel.send("You cannot warn a bot.");
    }
    // Check if the user is the bot itself
    if (userId === message.client.user.id) {
        return message.channel.send("You cannot warn the bot itself.");
    }
    // format userId and check for valid user ID
    if (!userId) {
        return message.channel.send("Please provide a valid user ID.");
    }
    if (userId.startsWith('<@')) {
        userId = userId.replace(/<@|>/g, '');
    }
    // Check if the user is already warned
    const moderation = JSON.parse(fs.readFileSync('./moderation/moderation.json', 'utf8'));
    var countWarnings = 1;
    moderation.warn.forEach(id => {
        if (id === userId) {
            countWarnings++;
        }
    });
    moderation.warn.push(userId);
    var position = "";
    switch (countWarnings) {
        case 1:
            position = "st";
            break;
        case 2:
            position = "nd";
            break;
        case 3:
            position = "rd";
            break;
        default:
            position = "th";
            break;
    }

    message.channel.send(`<@${userId}>, this is your ${countWarnings}${position} warning!`);
    fs.writeFileSync('./moderation/moderation.json', JSON.stringify(moderation, null, 2));
}

module.exports = {
    warn,
};