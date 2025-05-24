// commands/checkin.js
import fs from 'fs';
import { EmbedBuilder } from 'discord.js';
import { setReminder } from './reminder.js';  // ← schedule reminders

export function checkin(message) {
  // Only server boosters may check in
  const isBooster = Boolean(message.member?.premiumSince);
  if (!isBooster) {
    return message.reply("you must be a server booster to use this command.");
  }

  // Load & update wallet
  const filePath = `./inventory/${message.author.id}.json`;
  const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  userData.wallet = (userData.wallet || 0) + 1000;
  fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));

  // Schedule next weekly check-in
  setReminder(message.author.id, 'checkin', 10080); // minutes → 7 days

  // Send confirmation embed
  const embed = new EmbedBuilder()
    .setTitle("Check In Signal Stabilized!")
    .setColor("#FFEE52")
    .setDescription(
      `1000 credits have been rewarded.\n\n` +
      `You currently have **${userData.wallet.toLocaleString()}** credits ` +
      `<:credits:1357992150457126992> in your wallet.`
    );

  return message.reply({ embeds: [embed] });
}
