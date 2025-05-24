// view.js
import fs from 'fs';
import path from 'path';
import db from '../db.js';                    // make sure db.js does `export default pool;`
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

export async function view(message, arg) {
  // (1) Ensure your DB query is inside the fn, not at top level
  const userId = message.mentions.users.first()?.id || message.author.id;
  const res = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (res.rows.length === 0) {
    return message.reply('you’re not registered in the database yet!');
  }

  // (2) Load metadata & inventory
  const metadata = JSON.parse(fs.readFileSync(path.resolve('./cards/metadata.json'), 'utf8'));
  const invPath  = path.resolve(`./inventory/${userId}.json`);
  if (!fs.existsSync(invPath)) {
    return message.reply(`<@${userId}> doesn’t have any cards yet!`);
  }
  const userInventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  // (3) Figure out which code to show
  let cardCode = arg;
  if (message.mentions.users.size > 0) {
    // if they mentioned someone, shift the code arg
    const parts = message.content.split(/\s+/).slice(1);
    cardCode = parts.find(p => !p.startsWith('<@')) || null;
  }
  if (!cardCode) {
    if (!userInventory.lastClaimed) {
      return message.reply(`<@${userId}> hasn’t claimed any cards yet!`);
    }
    cardCode = userInventory.lastClaimed;
  }

  // (4) Find the card and how many they own
  const card = metadata.find(c => c.code.toLowerCase() === cardCode.toLowerCase());
  if (!card) {
    return message.reply('card not found in the metadata.');
  }
  const owned = userInventory.cards.find(c => c.code === card.code)?.count ?? 0;

  // (5) Build embed
  const colorMap = {
    "3G":   "#81b8ff",
    "4G":   "#ffb381",
    "5G":   "#b981ff",
    "PRISM":"#ff82d6",
    "LTE":  "#b5b5b5"
  };
  const colour = colorMap[card.rarity] ?? "#ffffff";

  const imagePath = path.resolve(`./cards/${card.code}.png`);
  if (!fs.existsSync(imagePath)) {
    return message.reply('card image not found.');
  }

  const attachment = new AttachmentBuilder(imagePath, { name: `${card.code}.png` });
  const embed = new EmbedBuilder()
    .setTitle(card.name)
    .setDescription(`${card.group} — ${card.era}\n**Rarity:** ${card.rarity}\n**Owned by ${message.mentions.users.first()?.username || message.author.username}:** ${owned}×`)
    .setColor(colour)
    .setImage(`attachment://${card.code}.png`)
    .setFooter({ text: `Card Code: ${card.code}` });

  await message.reply({ embeds: [embed], files: [attachment] });
}
