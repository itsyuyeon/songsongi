import fs from 'fs';
import path from 'path';

/**
 * Withdraw credits from the user’s syncbank into their wallet.
 * Usage: .withdraw <amount>
 */
export async function withdraw(message, amountArg) {
  // Parse & validate amount
  const amount = parseInt(amountArg, 10);
  if (isNaN(amount) || amount <= 0) {
    await message.reply('Usage: `.withdraw <amount>` (must be a positive number)');
    return;
  }

  const userFile = path.resolve('./inventory', `${message.author.id}.json`);
  let userData;

  // Load user data
  try {
    userData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  } catch (err) {
    console.error('Failed to read inventory file:', err);
    await message.reply('Could not access your inventory data.');
    return;
  }

  // Check balance
  if (userData.syncbank < amount) {
    await message.reply(
      `You don’t have enough credits in Syncbank (you have ${userData.syncbank}).`
    );
    return;
  }

  // Perform withdrawal
  userData.syncbank -= amount;
  userData.wallet = (userData.wallet || 0) + amount;

  // Save changes
  try {
    fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
  } catch (err) {
    console.error('Failed to write inventory file:', err);
    await message.reply('Could not save your new balance.');
    return;
  }

  // Confirm to user
  await message.reply(
    `You withdrew **${amount.toLocaleString()}** credits. Your new Syncbank balance: **${userData.syncbank.toLocaleString()}**.`
  );
}
