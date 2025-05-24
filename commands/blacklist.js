import fs from 'fs';
import { EmbedBuilder } from 'discord.js';

export function isBlacklisted(userId) {
    const moderation = JSON.parse(fs.readFileSync('./moderation/moderation.json', 'utf8'));
    return moderation.blacklist.includes(userId);
}

export function blacklistMessage(message) {
    message.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle("**You are blacklisted!**")
                .setDescription("_You are not allowed to use any commands._")
                .setColor("#F9768C")
        ]
    });
}

export function addToBlacklist(userId) {
    const moderation = JSON.parse(fs.readFileSync('./moderation/moderation.json', 'utf8'));
    moderation.blacklist.push(userId);
    fs.writeFileSync('./moderation/moderation.json', JSON.stringify(blacklist, null, 2));
}

export function removeFromBlacklist(userId) {
    const moderation = JSON.parse(fs.readFileSync('./moderation/moderation.json', 'utf8'));
    moderation.blacklist = moderation.blacklist.filter(user => user !== userId);
    fs.writeFileSync('./moderation/moderation.json', JSON.stringify(moderation, null, 2));
}

export function blacklist(message, userId) {
    // check for valid user ID
    if (!userId) {
        return message.channel.send("Please provide a valid user ID.");
    }
    // format userId
    if (userId.startsWith('<@')) {
        userId = userId.replace(/<@|>/g, '');
    }
    // Check if the user is a bot
    if (message.mentions.users.first().bot) {
        return message.channel.send("You cannot blacklist a bot.");
    }
    // Check if the user is the bot itself
    if (userId === message.client.user.id) {
        return message.channel.send("You cannot blacklist the bot itself.");
    }
    // Check if the user is already blacklisted
    if (isBlacklisted(userId)) {
        return message.channel.send(`User <@${userId}> is already blacklisted.`);
    }
    // Add the user to the blacklist
    addToBlacklist(userId);
    return message.channel.send(`User <@${userId}> has been blacklisted.`);
}

export function unblacklist(message, userId) {
    // check for valid user ID
    if (!userId) {
        return message.channel.send("Please provide a valid user ID.");
    }
    // format userId
    if (userId.startsWith('<@')) {
        userId = userId.replace(/<@|>/g, '');
    }
    // Check if the user is not blacklisted
    if (!isBlacklisted(userId)) {
        return message.channel.send(`User <@${userId}> is not blacklisted.`);
    }
    // Remove the user from the blacklist
    removeFromBlacklist(userId);
    return message.channel.send(`User <@${userId}> has been unblacklisted.`);
}

export{
    blacklist,
    unblacklist,
    isBlacklisted,
    blacklistMessage,
}