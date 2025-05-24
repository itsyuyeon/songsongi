// commands/view.js
import fs from 'fs';
import path from 'path';
import pool from '../db.js'; // your pg Pool, exported as default
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

export async function view(message, arg) {
  // figure out target user (mention or author)
  const targetUser = message.mentions.users.first() || message.author;
  const userId = targetUser.id;

  // ensure they're registered in your users table
  const res = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
  if (res.rows.length === 0) {
    return message.reply('You’re not registered in the database yet!');
  }

  // load metadata
  const metadataPath = path.resolve('./cards/metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  // load or bail on inventory json
  const invPath = path.resolve(`./inventory/${userId}.json`);
  if (!fs.existsSync(invPath)) {
    return message.reply(`<@${userId}> doesn’t have any cards yet!`);
  }
  const userInventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  // determine which code arg to use
  let codeArg = arg;
  // if they mentioned someone and then passed a code, skip the mention
  if (message.mentions.users.size > 0 && arg && arg.startsWith('<@')) {
    // e.g. ".view @Bob GYUVIN"
    const parts = message.content.split(/\s+/).slice(1);
    codeArg = parts.find(p => !p.startsWith('<@'));
  }
  // fallback to last claimed
  if (!codeArg) {
    if (!userInventory.lastClaimed) {
      return message.reply(`<@${userId}> hasn’t claimed any cards yet!`);
    }
    codeArg = userInventory.lastClaimed;
  }

  // find the card in metadata
  const card = metadata.find(c => c.code.toLowerCase() === codeArg.toLowerCase());
  if (!card) {
    return message.reply('Card not found in metadata.');
  }

  // count how many they own
  const ownedEntry = userInventory.cards.find(c => c.code === card.code);
  const ownedCount = ownedEntry?.count ?? 0;

  // pick a color based on rarity
  const colorMap = {
    "3G":   "#81b8ff",
    "4G":   "#ffb381",
    "5G":   "#b981ff",
    "PRISM":"#ff82d6",
    "LTE":  "#b5b5b5"
  };
  const embedColor = colorMap[card.rarity] || "#ffffff";

  // attach the card image
  const imagePath = path.resolve(`./cards/${card.code}.png`);
  if (!fs.existsSync(imagePath)) {
    return message.reply('Card image not found on disk.');
  }
  const attachment = new AttachmentBuilder(imagePath, { name: `${card.code}.png` });

  // build and send embed
  const embed = new EmbedBuilder()
    .setTitle(card.name)
    .setDescription(
      `${card.group} — ${card.era}\n` +
      `**Rarity:** ${card.rarity}\n` +
      `**Owned by ${targetUser.username}:** ${ownedCount}×`
    )
    .setColor(embedColor)
    .setImage(`attachment://${card.code}.png`)
    .setFooter({ text: `Card Code: ${card.code}` });

  await message.reply({ embeds: [embed], files: [attachment] });
}
