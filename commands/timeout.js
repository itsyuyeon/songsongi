import fs from 'fs';
import { EmbedBuilder } from 'discord.js';

export function timeout(message, userId, time) {
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only Head Admins can use this command!');
        return;
    }
    // Validate inputs
    if (!userId) {
        message.reply('Usage: .timeout <userID> <time in minutes>');
        return;
    }
    // format userId
    if (userId.startsWith('<@')) {
        userId = userId.replace(/<@|>/g, '');
    }

    const moderation = JSON.parse(fs.readFileSync('./moderation/moderation.json', 'utf8'));
    moderation.timeout.push({
        userId: userId,
        time: Date.now()+(time*60000)
    });
    message.reply(`<@${userId}> has been timed out for ${time} minutes.`);
}

export function removeTimeout(userId) {
    const moderation = JSON.parse(fs.readFileSync('./moderation/moderation.json', 'utf8'));
    moderation.timeout = moderation.timeout.filter(timeout => timeout.userId !== userId);
    fs.writeFileSync('./moderation/moderation.json', JSON.stringify(moderation, null, 2));
}

export function isTimeout(userId) {
    const moderation = JSON.parse(fs.readFileSync('./moderation/moderation.json', 'utf8'));
    const timeoutUser = moderation.timeout.find(timeout => timeout.userId === userId);
    if (timeoutUser) {
        return timeoutUser.time > Date.now();
    }
    return false;
}

export function timeoutMessage(message) {
    const moderation = JSON.parse(fs.readFileSync('./moderation/moderation.json', 'utf8'));
    const timeoutUser = moderation.timeout.find(timeout => timeout.userId === userId);
    const timeLeft = Math.ceil((timeoutUser.time - Date.now()) / 60000);
    message.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle(`**You are timed out for ${timeLeft} minutes!**`)
                .setDescription("_You are not allowed to use any commands._")
                .setColor("#F9768C")
        ]
    });
}

export{
    timeout,
    removeTimeout,
    isTimeout,
    timeoutMessage
};