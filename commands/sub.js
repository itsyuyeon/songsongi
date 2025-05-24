import fs from 'fs';

export function sub(message, userId, amount) {
    const hasAdminRole = message.member.roles.cache.some(role =>
        role.name === "head admin" || role.name === "community staff"
    );
    const isHeadAdmin = message.member.roles.cache.some(role => role.name === "head admin");

    if (!hasAdminRole) {
        message.reply('You are not allowed to use this!');
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
        return;
    }

    const receiverData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    receiverData.wallet = Math.max(0, receiverData.wallet - amount); // prevent negative wallet
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));

    message.channel.send(`Removed ${amount} credits from <@${userId}>'s wallet!`);
}
