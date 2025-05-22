const fs = require("fs");

function resetCooldown(message, userId, type) {
    if (!message.member.roles.cache.some(role => role.name === "head admin" || role.name === "system operator")) {
        message.reply('Only system operator can use this command!');
        return;
    }

        if (userId === message.author.id && !(isHeadAdmin || isSysOp)) {
        return message.reply('❌ You do not have permission to reset your own cooldown.');
    }

    if (!userId || !type) {
        message.channel.send('Usage: `.resetcd <@username/User ID> <command>`');
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
        message.channel.send('You cannot your own cooldowns!');
        return;
    }
    // check if userId is a valid user with fs
    if (!fs.existsSync(`./inventory/${userId}.json`)) {
        message.channel.send('User not in database!');
        return;
    }

    const receiverData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    if (receiverData.cooldown[type] == undefined) {
        message.channel.send("Invalid command!");
        return;
    }
    receiverData.cooldown[type] = Date.now();
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));
    
    message.channel.send(`Cooldown reset for ${type} command for <@${userId}>!`);
}

module.exports = {
    resetCooldown
}