import { EmbedBuilder } from 'discord.js';
import fs from 'fs';

export function parseArgs(content = '') {
  const args = content.trim().split(/\s+/);
  const filters = {
    type: 'cards',
    group: null,
    era: null,
    series: null,
    rarity: null,
    idol: null,
    top: 10
  };
  for (let arg of args) {
    arg = arg.toLowerCase();
    if (arg.startsWith('g=')) filters.group = arg.slice(2);
    else if (arg.startsWith('era=')) filters.era = arg.slice(4);
    else if (arg.startsWith('series=')) filters.series = arg.slice(7);
    else if (arg.startsWith('rarity=')) filters.rarity = arg.slice(7);
    else if (arg.startsWith('idol=')) filters.idol = arg.slice(5);
    else if (arg.startsWith('top=')) filters.top = Math.max(1, parseInt(arg.slice(4)) || 10);
    else if (["cards","credits","bal"].includes(arg)) {
      filters.type = arg === 'bal' ? 'credits' : arg;
    }
  }
  return filters;
}

export async function leaderboard(message, rawArgs = '') {
  const { type, group, era, series, rarity, idol, top } = parseArgs(rawArgs);

  // only JSON files
  const inventories = fs.readdirSync('./inventory').filter(f => f.endsWith('.json'));
  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));

  // preprocess filter set for cards
  const filteredCards = metadata.filter(card => {
    if (group  && card.group?.toLowerCase()  !== group)  return false;
    if (era    && card.era?.toLowerCase()    !== era)    return false;
    if (series && card.series?.toLowerCase() !== series) return false;
    if (rarity && card.rarity?.toLowerCase() !== rarity) return false;
    if (idol   && card.idolname?.toLowerCase() !== idol) return false;
    return true;
  });
  const allowedCodes = new Set(filteredCards.map(c => c.code));

  const leaderboardData = inventories.map(file => {
    const userId = file.slice(0, -5);
    const userData = JSON.parse(fs.readFileSync(`./inventory/${file}`, 'utf8'));

    let value;
    if (type === 'credits') {
      value = (userData.wallet||0) + (userData.syncbank||0);
    } else {
      // count cards
      value = userData.cards.reduce((sum, owned) => {
        // if no filter or code is in allowed set
        return sum + (allowedCodes.size === metadata.length
          ? owned.count
          : allowedCodes.has(owned.code) ? owned.count : 0);
      }, 0);
    }
    return { id: userId, value };
  });

  leaderboardData.sort((a, b) => b.value - a.value);
  const topData = leaderboardData.filter(e => e.value > 0).slice(0, top);

  const titleType = type === 'credits' ? 'BALANCE' : 'CARDS';
  const filterText = [group, era, series, rarity, idol].filter(Boolean).join(' / ');
  const embed = new EmbedBuilder()
    .setTitle(`${titleType} Leaderboard${filterText ? ` (${filterText})` : ''}`)
    .setColor('#BB52FF')
    .setDescription(
      topData.length
        ? topData.map((e,i) => `${i+1}. <@${e.id}> — ${e.value}`).join('\n')
        : 'No data found.'
    );

  await message.reply({ embeds: [embed] });
}
