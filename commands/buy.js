// commands/buy.js
import fs from 'fs';
import { EmbedBuilder } from 'discord.js';
import db from '../db.js';                // your default-exported Pool instance

/**
 * Buy a pack from the shop.
 *
 * @param {import('discord.js').Message|import('discord.js').Interaction} intermsg
 * @param {string} cardpack   the pack code to buy
 * @param {string|number} amount how many to buy
 */
export async function buy(intermsg, cardpack, amount) {
  // figure out user ID (supports both messageCreate and button interactions)
  const userId = intermsg.author?.id ?? intermsg.user?.id;

  // usage check
  if (!cardpack || !amount) {
    return intermsg.reply('usage: `.buy <cardpack> <amount>`');
  }

  // make sure user exists in Postgres
  const { rows } = await db.query('SELECT 1 FROM users WHERE id = $1', [userId]);
  if (rows.length === 0) {
    return intermsg.reply('you’re not registered yet—run `.start` first!');
  }

  // load shop config
  const shopData = JSON.parse(fs.readFileSync('./shop/shop.json', 'utf8'));
  const item     = shopData.find(i => i.code === cardpack);
  if (!item) {
    return intermsg.reply('item not found in the shop!');
  }

  // normalize and validate amount
  amount = Math.abs(parseInt(amount, 10));
  if (!amount || amount > 10) {
    return intermsg.reply('you can buy between 1 and 10 packs at a time.');
  }

  // load the user’s JSON inventory
  const invPath  = `./inventory/${userId}.json`;
  const userData = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  // check funds
  const cost = item.price * amount;
  if (userData.wallet < cost) {
    const need = cost - userData.wallet;
    return intermsg.reply(`You need ${need.toLocaleString()} more credits to buy ${amount}× ${item.name}.`);
  }

  // deduct and add
  userData.wallet -= cost;
  for (let i = 0; i < amount; i++) {
    userData.cardpacks.push(item);
  }

  // persist
  fs.writeFileSync(invPath, JSON.stringify(userData, null, 2));

  // confirm
  return intermsg.reply(`you bought **${amount}× ${item.name}** for ${cost.toLocaleString()} credits!`);
}
