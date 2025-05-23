import fs from 'fs';

async function deposit(message, amount) {
    // Check if valid amount
    amount = parseInt(amount);
    if (!amount || isNaN(amount) || amount <= 0) {
        message.reply('Usage: .deposit <amount>');
        return;
    }

    // Check if the user has enough money
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    if (userData.wallet < amount) {
        message.reply(`You don't have enough money! You only have ${userData.wallet} credits.`);
        return;
    }

    // Deposit the money
    userData.wallet -= amount;
    userData.syncbank += amount;
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));

    message.channel.send(`You have deposited ${amount} credits <:credits:1357992150457126992>! Your syncbank's new balance is ${userData.syncbank} credits <:credits:1357992150457126992>.`);
}

module.exports = {
    deposit
};