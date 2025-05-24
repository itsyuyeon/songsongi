import { EmbedBuilder } from 'discord.js';

export function send(message, userId, content) {
    if (!message.member.roles.cache.some(role => role.name === "head admins")) {
        message.reply('look away, this is not for you!');
        return;
    }
    // Check if the userId is valid
    if ((!userId || isNaN(userId)) && !content) {
        return message.reply('Usage: `.send <userID/@username> <message>`');
    }
    
    if (userId.startsWith('<@')) {
        userId = userId.replace(/<@|>/g, '');
    }
    // Send a message to the user with the given userId
    const user = message.client.users.cache.get(userId);
    if (user) {
        user.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`**Message from ${message.author.username}**`)
                    .setDescription(content)
                    .setColor("#F9768C")
            ]
        })
            
        message.reply(`Message sent to ${user.username}`);
    } else {
        message.reply(`User not found`);
    }
}

