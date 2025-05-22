const fs = require("fs");

function resetCooldown(message, userId, type) {
    const hasAdminRole = message.member.roles.cache.some(role =>
        role.name === "head admin" || role.name === "system operator"
    );
    const isHeadAdmin = message.member.roles.cache.some(role => role.name === "head admin");

    if (!hasAdminRole) {
        message.reply('Only system operator or head admin can use this command!');
        return;
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

    // ✅ Block self-reset unless the user is head admin
    if (userId === message.author.id && !isHeadAdmin) {
        message.channel.send('Only head admins can reset their own cooldowns!');
        return;
    }

    if (!fs.existsSync(`./inventory/${userId}.json`)) {
        message.channel.send('User not in database!');
        return;
    }

    if (!receiverData.cooldown || !(type in receiverData.cooldown)) {
    message.channel.send("Invalid or unset cooldown type!");
    return;
    }

    const receiverData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    if (receiverData.cooldown[type] === undefined) {
        message.channel.send("Invalid command!");
        return;
    }

    receiverData.cooldown[type] = Date.now();
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));

    message.channel.send(`Cooldown reset for ${type} command for <@${userId}>!`);
}

module.exports = {
    resetCooldown
};
