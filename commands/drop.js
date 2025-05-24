import fs from 'fs';
import path from 'path';
import db from '../db.js';
import {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

const activeInventories = new Map();

async function checkUserExists(userId) {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows.length > 0;
}

export async function inventory(message) {
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  const exists = await checkUserExists(targetId);
  if (!exists) {
    return message.reply(`<@${targetId}> has no data in the system.`);
  }

  const filePath = `./inventory/${targetId}.json`;
  if (!fs.existsSync(filePath)) {
    return message.reply(`<@${targetId}> has no inventory data.`);
  }

  const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));

  const embed = new EmbedBuilder()
    .setTitle(`${targetUser.username}'s Inventory`)
    .setColor('#52A5FF');

  let SIGNAL = 0, LTE = 0, PRISM = 0;
  userData.cards.forEach(card => {
    const cardData = metadata.find(c => c.code === card.code);
    if (!cardData) return;
    if (["3G", "4G", "5G"].includes(cardData.rarity)) SIGNAL += card.count;
    else if (cardData.rarity === "LTE") LTE += card.count;
    else if (cardData.rarity === "PRISM") PRISM += card.count;
  });

  embed.addFields({
    name: 'Summary',
    value: `**SIGNAL** - \`${SIGNAL}\`
**LTE** - \`${LTE}\`
**PRISM** - \`${PRISM}\``,
    inline: true
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('filter')
    .setPlaceholder('Rarity Filter')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('SIGNAL CARDS').setValue('SIGNAL'),
      new StringSelectMenuOptionBuilder().setLabel('LTE CARDS').setValue('LTE'),
      new StringSelectMenuOptionBuilder().setLabel('PRISM CARDS').setValue('PRISM')
    );

  const row = new ActionRowBuilder().addComponents(select);
  message.reply({ embeds: [embed], components: [row] });
}

export async function filter(interaction) {
  const rarity = interaction.values[0];
  const userId = interaction.user.id;
  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
  const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));

  const embed = new EmbedBuilder()
    .setTitle(`${interaction.user.username}'s Inventory`)
    .setColor('#52A5FF');

  let groupedCards = new Map();
  userData.cards.forEach(card => {
    const cardData = metadata.find(c => c.code === card.code);
    if (!cardData) return;

    const isMatch =
      (rarity === 'SIGNAL' && ['3G', '4G', '5G'].includes(cardData.rarity)) ||
      (cardData.rarity === rarity);

    if (isMatch) {
      const groupKey = `${cardData.group} - ${cardData.era}`;
      const display = `${cardData.code} ${cardData.name} - \`${card.count}\``;
      if (!groupedCards.has(groupKey)) groupedCards.set(groupKey, []);
      groupedCards.get(groupKey).push(display);
    }
  });

  for (let [group, cards] of groupedCards) {
    embed.addFields({ name: `**${group}**`, value: cards.join('\n'), inline: false });
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('filter')
    .setPlaceholder('Rarity Filter')
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel('SIGNAL CARDS').setValue('SIGNAL'),
      new StringSelectMenuOptionBuilder().setLabel('LTE CARDS').setValue('LTE'),
      new StringSelectMenuOptionBuilder().setLabel('PRISM CARDS').setValue('PRISM')
    );

  const row = new ActionRowBuilder().addComponents(select);
  interaction.update({ embeds: [embed], components: [row] });
}

export { drop, handleButtonInteraction, paidDrop };
