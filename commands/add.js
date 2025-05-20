const fs = require('fs');

function add(message, userId, amount) {
    if (!message.member.roles.cache.some(role => role.name === "system operator")) {
        message.reply('Only system operators can use this command!');
        return;
    }

    if (!userId || !amount) {
        message.channel.send('Usage: `.add <@username/User ID> <specific number>`');
        return;
    }

    if (userId.startsWith('<@')) {
        userId = userId.replace(/[<@&>]/g, '');
    } else if (userId.startsWith('@')) {
        userId = userId.replace(/[@]/g, '');
    }
    
    if (!userId.match(/^\d+$/)) {
        message.channel.send('Invalid user ID!');
        return;
    }
    if (userId === message.author.id) {
        message.channel.send('You cannot give yourself credits!');
        return;
    }
    // check if userId is a valid user with fs
    if (!fs.existsSync(`./inventory/${userId}.json`)) {
        message.channel.send('User not in database!');
        return;
    }
    
    // check if amount is valid
    amount = Math.abs(parseInt(amount));
    if (isNaN(amount) || amount <= 0) {
        message.channel.send(`You cannot add ${amount} cards!`);
        return;
    }
    
    const receiverData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    
    receiverData.wallet += amount;
    
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));
    
    message.channel.send(`Added ${amount} credits to <@${userId}> wallet!`);
}

module.exports = {
    add
};