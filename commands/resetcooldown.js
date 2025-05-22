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

    if (userId === message.author.id && !isHeadAdmin) {
        message.channel.send('You cannot reset your own cooldown unless you are a head admin!');
        return;
    }

    const filePath = `./inventory/${userId}.json`;
    if (!fs.existsSync(filePath)) {
        message.channel.send('User not in database!');
        return;
    }

    const receiverData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!receiverData.cooldown || receiverData.cooldown[type] === undefined) {
        message.channel.send("Invalid command!");
        return;
    }

    receiverData.cooldown[type] = Date.now();
    fs.writeFileSync(filePath, JSON.stringify(receiverData, null, 2));

    message.channel.send(`Cooldown reset for \`${type}\` command for <@${userId}>!`);
}

module.exports = {
    resetCooldown
};
