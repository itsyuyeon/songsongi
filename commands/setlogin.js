const fs = require("fs");

function setLogin(message, userId, amount) {
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only head admins can use this command!');
        return;
    }

    if (!userId || !amount) {
        message.channel.send('Usage: `.setlogin <@username/User ID> <amount>`');
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
        message.channel.send('You cannot your own streak!');
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
    receiverData.streak.login = amount;
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));
        
    message.channel.send(`Login streak for <@${userId}> is set to ${amount}!`);
}

export{
    setLogin
}