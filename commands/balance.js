// commands/balance.js
import fs from 'fs';
import pool from '../db.js';            // your PG Pool as a default export
import { EmbedBuilder } from 'discord.js';

export async function balance(message, arg) {
  // 1) Figure out who we’re checking
  let targetUser = message.mentions.users.first();
  let targetId;
  if (targetUser) {
    targetId = targetUser.id;
  } else if (arg && /^\d{17,20}$/.test(arg)) {
    targetId = arg;
    targetUser = null;
  } else {
    targetUser = message.author;
    targetId = targetUser.id;
  }

  // 2) DB lookup: bail if they haven’t run .start
  const { rows } = await pool.query(
    'SELECT 1 FROM users WHERE id = $1',
    [targetId]
  );
  if (rows.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle("**You are still offline in the HyperSync Grid!**")
      .setDescription("_Your identity hasn't been synced and you're not connected to the network yet._")
      .setFooter({ text: "Kindly do `.start` to sync your account!" })
      .setColor("#F9768C");
    return message.reply({ embeds: [embed] });
  }

  // 3) Load inventory JSON (should now exist)
  const filePath = `./inventory/${targetId}.json`;
  if (!fs.existsSync(filePath)) {
    return message.reply(`<@${targetId}> has no data in the system.`);
  }
  const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 4) Resolve a display username if we only have an ID
  if (!targetUser) {
    try {
      targetUser = await message.client.users.fetch(targetId);
    } catch {
      targetUser = { username: `User ID ${targetId}` };
    }
  }

  // 5) Build and send the embed
  const embed = new EmbedBuilder()
    .setColor("#F9768C")
    .setTitle(`${targetUser.username}'s Balance`)
    .addFields(
      {
        name: "💰 Wallet",
        value: `\`${userData.wallet.toLocaleString()}\` <:credits:1357992150457126992>`,
        inline: true
      },
      {
        name: "🏦 Syncbank",
        value: `\`${userData.syncbank.toLocaleString()}\` <:credits:1357992150457126992>`,
        inline: true
      }
    );

  return message.reply({ embeds: [embed] });
}
