const fs = require('fs');
function transfer(message, oldUser, newUser) {
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only Head Admins can use this command!');
        return;
    }
    // Validate inputs
    if (!oldUser || !newUser) {
        message.reply('Usage: .transfer <oldUserID> <newUserID>');
        return;
    }
    // format userId
    if (oldUser.startsWith('<@')) {
        oldUser = oldUser.replace(/<@|>/g, '');
    }
    if (newUser.startsWith('<@')) {
        newUser = newUser.replace(/<@|>/g, '');
    }
    
    // Check if the user has an inventory file
    if (!fs.existsSync(`./inventory/${oldUser}.json`)) {
        message.reply('Old User ID not found.');
        return;
    }
    // Check if the new user already has an inventory file
    if (fs.existsSync(`./inventory/${newUser}.json`)) {
        message.reply('New User ID already exists.');
        return;
    }
    
    // Rename the inventory file
    fs.renameSync(`./inventory/${oldUser}.json`, `./inventory/${newUser}.json`);
    
    message.reply(`Inventory transferred from ${oldUser} to ${newUser}.`);
}

module.exports = {
    transfer
};