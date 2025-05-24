import fs from 'fs';
import path from 'path';
import pool from '../db.js';            // default export of your Pool instance
import {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

// In-memory state for pagination
const activeInventories = new Map();

export function paginate(array, pageSize) {
  return array.reduce((acc, val, i) => {
    const pageIndex = Math.floor(i / pageSize);
    acc[pageIndex] = [...(acc[pageIndex] || []), val];
    return acc;
  }, []);
}

export async function inventory(message) {
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // Verify user exists in DB
  const { rows } = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [targetId]
  );
  if (rows.length === 0) {
    return message.reply('User not found in database.');
  }

  const metadata = JSON.parse(
    fs.readFileSync(path.resolve('./cards/metadata.json'), 'utf8')
  );
  const userData = JSON.parse(
    fs.readFileSync(path.resolve(`./inventory/${targetId}.json`), 'utf8')
  );

  // Filter owned cards
  const ownedCodes = new Set(userData.cards.map(c => c.code));
  const cards = metadata.filter(c => ownedCodes.has(c.code));
  const pages = paginate(cards, 25);

  const state = {
    userId: targetId,
    cards,
    currentPage: 0,
  };
  activeInventories.set(message.id, state);

  const embed = generateEmbed(targetUser, pages[0], 1, pages.length);
  const row = generateButtons();
  const select = generateDropdown();

  await message.reply({ embeds: [embed], components: [row, select] });
}

export function generateEmbed(user, cards, currentPage, totalPages) {
  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Inventory`)
    .setColor('#52A5FF')
    .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

  cards.forEach(card => {
    embed.addFields({
      name: card.code,
      value: `${card.name} — ${card.group} (${card.rarity})`,
      inline: false
    });
  });

  return embed;
}

export function generateButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('first_page').setLabel('⏪').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('prev_page').setLabel('◀️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('export_codes').setLabel('🔽 Export').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('next_page').setLabel('▶️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('last_page').setLabel('⏩').setStyle(ButtonStyle.Secondary)
  );
}

export function generateDropdown() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('filter_inv')
      .setPlaceholder('Filter by Rarity')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('All').setValue('ALL'),
        new StringSelectMenuOptionBuilder().setLabel('3G').setValue('3G'),
        new StringSelectMenuOptionBuilder().setLabel('4G').setValue('4G'),
        new StringSelectMenuOptionBuilder().setLabel('5G').setValue('5G'),
        new StringSelectMenuOptionBuilder().setLabel('LTE').setValue('LTE'),
        new StringSelectMenuOptionBuilder().setLabel('PRISM').setValue('PRISM')
      )
  );
}

export async function handleInventoryInteraction(interaction) {
  const state = activeInventories.get(interaction.message.id);
  if (!state || interaction.user.id !== state.userId) {
    return interaction.reply({ content: 'This is not your inventory view.', ephemeral: true });
  }

  if (interaction.customId === 'export_codes') {
    const text = state.cards.map(c => c.code).join('\n');
    const filePath = path.resolve('./temp', `inventory_${state.userId}.txt`);
    fs.writeFileSync(filePath, text);
    return interaction.reply({ content: 'Exported card codes:', files: [filePath], ephemeral: true });
  }

  const pages = paginate(state.cards, 25);
  const totalPages = pages.length;

  switch (interaction.customId) {
    case 'first_page': state.currentPage = 0; break;
    case 'prev_page':  state.currentPage = Math.max(0, state.currentPage - 1); break;
    case 'next_page':  state.currentPage = Math.min(totalPages - 1, state.currentPage + 1); break;
    case 'last_page':  state.currentPage = totalPages - 1; break;
  }

  const currentCards = pages[state.currentPage];
  const embed = generateEmbed(interaction.user, currentCards, state.currentPage + 1, totalPages);
  const row = generateButtons();
  const select = generateDropdown();

  await interaction.update({ embeds: [embed], components: [row, select] });
}

export async function handleFilterSelection(interaction) {
  const state = activeInventories.get(interaction.message.id);
  if (!state || interaction.user.id !== state.userId) {
    return interaction.reply({ content: 'Not allowed.', ephemeral: true });
  }

  const filter = interaction.values[0];
  const metadata = JSON.parse(
    fs.readFileSync(path.resolve('./cards/metadata.json'), 'utf8')
  );
  const userData = JSON.parse(
    fs.readFileSync(path.resolve(`./inventory/${state.userId}.json`), 'utf8')
  );
  const ownedCodes = new Set(userData.cards.map(c => c.code));

  state.cards = metadata.filter(c =>
    ownedCodes.has(c.code) &&
    (filter === 'ALL' || c.rarity === filter)
  );
  state.currentPage = 0;

  const pages = paginate(state.cards, 25);
  const embed = generateEmbed(interaction.user, pages[0], 1, pages.length);
  const row = generateButtons();
  const select = generateDropdown();

  await interaction.update({ embeds: [embed], components: [row, select] });
}
