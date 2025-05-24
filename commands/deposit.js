// commands/deposit.js
import fs from 'fs';

export async function deposit(message, amount) {
  // Check if valid amount
  amount = parseInt(amount);
  if (!amount || isNaN(amount) || amount <= 0) {
    await message.reply('Usage: .deposit <amount>');
    return;
  }

  // Load user data
  const file = `./inventory/${message.author.id}.json`;
  const userData = JSON.parse(fs.readFileSync(file, 'utf8'));

  // Check wallet
  if (userData.wallet < amount) {
    await message.reply(`You don't have enough money! You only have ${userData.wallet.toLocaleString()} credits.`);
    return;
  }

  // Deposit
  userData.wallet -= amount;
  userData.syncbank += amount;
  fs.writeFileSync(file, JSON.stringify(userData, null, 2));

  await message.channel.send(
    `You have deposited ${amount.toLocaleString()} credits <:credits:1357992150457126992>!\n` +
    `Your syncbank's new balance is ${userData.syncbank.toLocaleString()} credits <:credits:1357992150457126992>.`
  );
}
