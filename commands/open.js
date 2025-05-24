// commands/open.js
import fs from 'fs';
import { EmbedBuilder } from 'discord.js';

/**
 * .open <code>
 *   - removes the named pack from the user’s cardpacks
 *   - draws `pack.cards` cards by weighted rarity
 *   - adds them to the user’s inventory
 *   - replies with an embed listing the drawn codes/names
 */
export async function open(message, code) {
  if (!code) {
    await message.reply('Usage: `.open <code>`');
    return;
  }

  const userId = message.author.id;
  const invPath = `./inventory/${userId}.json`;
  if (!fs.existsSync(invPath)) {
    await message.reply("You don't have any inventory yet.");
    return;
  }

  const userData = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const packIndex = userData.cardpacks.findIndex(p => p.code.toLowerCase() === code.toLowerCase());
  if (packIndex === -1) {
    await message.reply('You do not have this card pack!');
    return;
  }

  // remove the pack
  const pack = userData.cardpacks.splice(packIndex, 1)[0];

  // load all un-archived metadata
  const metadata = JSON
    .parse(fs.readFileSync('./cards/metadata.json', 'utf8'))
    .filter(c => !c.archived);

  // draw cards
  const drawn = getRandomCards(metadata, pack.cards, pack.rarity);

  // add drawn cards to inventory
  drawn.forEach(card => {
    if (!card) return;
    const idx = userData.cards.findIndex(c => c.code === card.code);
    if (idx === -1) {
      userData.cards.push({ code: card.code, count: 1 });
    } else {
      userData.cards[idx].count++;
    }
  });

  // save inventory
  fs.writeFileSync(invPath, JSON.stringify(userData, null, 2));

  // build reply
  const description = drawn
    .map(c => `\`${c.code}\` ${c.name}`)
    .join('\n') || '_No cards drawn._';

  const embed = new EmbedBuilder()
    .setTitle('📦 Pack opened! Here are your cards:')
    .setDescription(description)
    .setColor('#96B5E3');

  await message.reply({ embeds: [embed] });
}

/**
 * Picks `count` cards from `metadata` according to `weights` (rarity→chance).
 * Removes drawn cards from the pool so you don’t get duplicates.
 */
export function getRandomCards(metadata, count, weights) {
  // make a working copy
  const pool = metadata.slice();
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const selected = [];

  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalWeight;
    let cum = 0;
    let chosenRarity = null;

    // find which rarity bucket r lands in
    for (const [rarity, w] of Object.entries(weights)) {
      cum += w;
      if (r <= cum) {
        chosenRarity = rarity;
        break;
      }
    }

    // pick a random card from that rarity
    const candidates = pool.filter(c => c.rarity === chosenRarity);
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      selected.push(pick);
      // remove from pool
      const idx = pool.findIndex(c => c.code === pick.code);
      pool.splice(idx, 1);
    }
  }

  // if we didn’t fill all slots (e.g. not enough in pool), top up from remaining
  while (selected.length < count && pool.length) {
    const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    selected.push(pick);
  }

  return selected;
}

/**
 * (Optional) sort function if you ever need to sort by rarity order.
 */
export function sortByRarity(a, b) {
  const order = { PRISM: 4, '5G': 3, '4G': 2, '3G': 1, LTE: 0 };
  return (order[b.rarity] || 0) - (order[a.rarity] || 0);
}
