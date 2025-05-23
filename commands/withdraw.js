import fs from 'fs';

async function withdraw(message, amount) {
    // Check if valid amount
    amount = parseInt(amount);
    if (!amount || isNaN(amount) || amount <= 0) {
        message.reply('Usage: .withdraw <amount>');
        return;
    }

    // Check if the user has enough money
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    if (userData.syncbank < amount) {
        message.reply(`You don't have enough money! You only have ${userData.syncbank} credits.`);
        return;
    }

    // withdraw the money
    userData.syncbank -= amount;
    userData.wallet += amount;
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));

    message.channel.send(`You have withdrew ${amount} credits! Your Syncbank's new balance is ${userData.syncbank} credits.`);
}

export{
    withdraw
};