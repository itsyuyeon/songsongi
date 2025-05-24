import fs from 'fs';
import { EmbedBuilder } from 'discord.js';

// Helper to calculate credits per copy based on rarity
function getCreditPerRarity(rarity) {
  switch (rarity) {
    case '3G': return Math.floor(Math.random() * (90 - 50 + 1)) + 50;
    case '4G': return Math.floor(Math.random() * (190 - 150 + 1)) + 150;
    case '5G': return Math.floor(Math.random() * (290 - 250 + 1)) + 250;
    case 'PRISM': return Math.floor(Math.random() * (390 - 350 + 1)) + 350;
    default: return 0;
  }
}

/**
 * Burn (delete) cards from a user's inventory.
 * Supports group sale: `.burn g <prefix> <all|dupes|<number>>`
 * Supports unlimited individual sales: `.burn <code> <all|dupes|<number>> ...`
 * First arg may be a mention or user ID to target another user.
 */
export function burn(message, codes) {
  // Determine target user
  let targetId;
  let idx = 0;
  const mention = message.mentions.users.first();
  if (mention) {
    targetId = mention.id;
    idx = 1;
  } else if (codes[0] && /^\d{17,20}$/.test(codes[0])) {
    targetId = codes[0];
    idx = 1;
  } else {
    targetId = message.author.id;
  }

  const args = codes.slice(idx);
  if (args.length === 0) {
    message.reply('Usage: `.burn [@user/uid] <code> <all|dupes|<number>> ... or `.burn [@user/uid] g <prefix> <all|dupes|<number>>`.');
    return;
  }

  // Load metadata and inventory
  const meta = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
  const invFile = `./inventory/${targetId}.json`;
  if (!fs.existsSync(invFile)) {
    message.reply('User inventory not found.');
    return;
  }
  const userData = JSON.parse(fs.readFileSync(invFile, 'utf8'));

  const embed = new EmbedBuilder().setColor('#FF0000').setTitle('Signals deletion in progress...');
  let description = '';
  let totalCredits = 0;

  // Group sale branch
  if (args[0].toLowerCase() === 'g') {
    if (args.length < 3) {
      message.reply('Usage: `.burn g <prefix> <all|dupes|<number>>`');
      return;
    }
    const prefix = args[1].toUpperCase();
    const mode = args[2].toLowerCase();
    const matches = userData.cards.filter(c => c.code.startsWith(prefix));
    if (matches.length === 0) {
      message.reply(`No cards found with prefix \`${prefix}\`.`);
      return;
    }
    for (const cardItem of matches) {
      const code = cardItem.code;
      const count = cardItem.count;
      let amount = 0;
      if (mode === 'all') {
        amount = count;
      } else if (mode === 'dupes') {
        amount = Math.max(count - 1, 0);
      } else if (!isNaN(Number(mode))) {
        amount = Math.min(count, Math.abs(Number(mode)));
      }
      if (amount <= 0) continue;
      const rarity = meta.find(x => x.code === code)?.rarity;
      const creditPer = getCreditPerRarity(rarity);
      const credits = creditPer * amount;
      totalCredits += credits;
      description += `\`${amount}\` copies of \`${code}\` for **${credits}** credits\n`;
      // Update inventory
      if (amount >= count) {
        userData.cards = userData.cards.filter(c => c.code !== code);
      } else {
        cardItem.count -= amount;
      }
    }

  } else {
    // Individual sales branch
    for (let i = 0; i < args.length; i++) {
      const token = args[i].toUpperCase();
      if (['ALL', 'DUPES'].includes(token) || !isNaN(Number(token))) {
        continue;
      }
      const code = token;
      const idxInv = userData.cards.findIndex(c => c.code === code);
      if (idxInv === -1) {
        description += `-# error, signal not found: \`${code}\`\n`;
        continue;
      }
      const cardItem = userData.cards[idxInv];
      const count = cardItem.count;
      // Determine sale amount
      let amount = 1;
      const next = (args[i + 1] || '').toLowerCase();
      if (next === 'all') {
        amount = count;
        i++;
      } else if (next === 'dupes') {
        amount = Math.max(count - 1, 0);
        i++;
      } else if (!isNaN(Number(next))) {
        amount = Math.min(count, Math.abs(Number(next)));
        i++;
      }
      if (amount <= 0) {
        description += `-# nothing to delete for \`${code}\`\n`;
        continue;
      }
      const rarity = meta.find(x => x.code === code)?.rarity;
      const creditPer = getCreditPerRarity(rarity);
      const credits = creditPer * amount;
      totalCredits += credits;
      description += `\`${amount}\` cop${amount > 1 ? 'ies' : 'y'} of \`${code}\` for **${credits}** credits\n`;
      // Update inventory
      if (amount >= count) {
        userData.cards.splice(idxInv, 1);
      } else {
        cardItem.count -= amount;
      }
    }
  }

  if (totalCredits === 0) {
    embed.setDescription(description || 'No valid cards were deleted.');
  } else {
    description += `\nTotal refunded: **${totalCredits}** credits`;
    userData.wallet = (userData.wallet || 0) + totalCredits;
    embed.setDescription(description);
  }

  // Persist changes and respond
  fs.writeFileSync(invFile, JSON.stringify(userData, null, 2));
  message.reply({ embeds: [embed] });
}
