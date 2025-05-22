const fs = require('fs');

function sub(message, userId, amount) {
    const hasAdminRole = message.member.roles.cache.some(role =>
        role.name === "head admin" || role.name === "system operator"
    );
    const isHeadAdmin = message.member.roles.cache.some(role => role.name === "head admin");

    if (!hasAdminRole) {
        message.reply('Only system operator or head admin can use this command!');
        return;
    }

    if (!userId || !amount) {
        message.channel.send('Usage: `.sub <@username/User ID> <specific number>`');
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
        message.channel.send('Only Head Admin can remove their own credits.');
        return;
    }

    if (!fs.existsSync(`./inventory/${userId}.json`)) {
        message.channel.send('User not in database!');
        return;
    }

    amount = Math.abs(parseInt(amount));
    if (isNaN(amount) || amount <= 0) {
        message.channel.send(`You cannot subtract ${amount} credits!`);
