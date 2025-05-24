import fs from 'fs';

export function del(message, userId) {
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only head admins can use this command!');
        return;
    }
    // Validate inputs
    if (!userId) {
        message.reply('Usage: .delete <userID>');
        return;
    }
    // format userId
    if (userId.startsWith('<@')) {
        userId = userId.replace(/<@|>/g, '');
    }
    
    // Check if the user has an inventory file
    if (!fs.existsSync(`./inventory/${userId}.json`)) {
        message.reply('User ID not found.');
        return;
    }
    // Delete the user's inventory file
    fs.unlinkSync(`./inventory/${userId}.json`);
    message.reply(`User with ID ${userId} has been deleted.`);
}
