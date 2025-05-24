import fs from 'fs';

export function pay(message, userId, amount) {
    if (!userId || !amount) {
        message.channel.send('Usage: `.pay <@username/userid> <all/specific number>');
        return;
    }

    const senderData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    if (amount == "all") {
        amount = senderData.wallet;
    } else {
        amount = Math.abs(parseInt(amount));
    }

    // check if the userId is a mention, username, or userId
    if (userId.startsWith('<@')) {
        userId = userId.replace(/[<@&>]/g, '');
    } else if (userId.startsWith('@')) {
        userId = userId.replace(/[@]/g, '');
    }
    // check if the userId is a valid userId
    if (!userId.match(/^\d+$/)) {
        message.channel.send('Invalid user ID!');
        return;
    }
    // check if userId is a valid user
    if (!fs.existsSync(`./inventory/${userId}.json`)) {
        message.channel.send('User not in database!');
        return;
    }
    const receiverData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));

    if (senderData.wallet >= amount) {
        senderData.wallet -= amount;
        receiverData.wallet += amount;
        fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(senderData, null, 2));
        fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));
        message.channel.send(`You paid ${amount} credits to <@${userId}>!`);
    } else {
        message.channel.send('You do not have enough credits!');
    }
}
