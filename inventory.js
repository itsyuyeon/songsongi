import config from './config.json' assert { type: 'json' };
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import fs from 'fs';

import { Pool } from '../db.js';                // your own db module must `export` Pool
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

function paginate(array, pageSize) {
  return array.reduce((acc, val, i) => {
    const pageIndex = Math.floor(i / pageSize);
    acc[pageIndex] = [...(acc[pageIndex] || []), val];
    return acc;
  }, []);
}

async function inventory(message) {
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // Optional: verify user exists in DB
  const dbRes = await Pool.query('SELECT id FROM users WHERE id = $1', [targetId]);
  if (dbRes.rows.length === 0) {
    return message.reply('User not found in database.');
  }

  const metadata = JSON.parse(fs.readFileSync(path.resolve('./cards/metadata.json'), 'utf8'));
  const userData = JSON.parse(fs.readFileSync(path.resolve(`./inventory/${targetId}.json`), 'utf8'));

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

function generateEmbed(user, cards, currentPage, totalPages) {
  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Inventory`)
    .setColor('#52A5FF')
    .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

  cards.forEach(card => {
    embed.addFields({ name: card.code, value: `${card.name} — ${card.group} (${card.rarity})`, inline: false });
  });

  return embed;
}

function generateButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('first_page').setLabel('⏪').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('prev_page').setLabel('◀️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('export_codes').setLabel('🔽 Export').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('next_page').setLabel('▶️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('last_page').setLabel('⏩').setStyle(ButtonStyle.Secondary)
  );
}

function generateDropdown() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('filter_inv')
      .setPlaceholder('Filter by Rarity')
      .addOptions(
        { label: 'All', value: 'ALL' },
        { label: '3G', value: '3G' },
        { label: '4G', value: '4G' },
        { label: '5G', value: '5G' },
        { label: 'LTE', value: 'LTE' },
        { label: 'PRISM', value: 'PRISM' }
      )
  );
}

async function handleInventoryInteraction(interaction) {
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

  if (interaction.customId === 'first_page') state.currentPage = 0;
  if (interaction.customId === 'prev_page') state.currentPage = Math.max(0, state.currentPage - 1);
  if (interaction.customId === 'next_page') state.currentPage = Math.min(totalPages - 1, state.currentPage + 1);
  if (interaction.customId === 'last_page') state.currentPage = totalPages - 1;

  const currentCards = pages[state.currentPage];
  const embed = generateEmbed(interaction.user, currentCards, state.currentPage + 1, totalPages);
  const row = generateButtons();
  const select = generateDropdown();

  await interaction.update({ embeds: [embed], components: [row, select] });
}

async function handleFilterSelection(interaction) {
  const state = activeInventories.get(interaction.message.id);
  if (!state || interaction.user.id !== state.userId) return interaction.reply({ content: 'Not allowed.', ephemeral: true });

  const filter = interaction.values[0];
  const metadata = JSON.parse(fs.readFileSync(path.resolve('./cards/metadata.json'), 'utf8'));
  const userData = JSON.parse(fs.readFileSync(path.resolve(`./inventory/${state.userId}.json`), 'utf8'));
  const ownedCodes = new Set(userData.cards.map(c => c.code));

  state.cards = metadata.filter(c => ownedCodes.has(c.code) && (filter === 'ALL' || c.rarity === filter));
  state.currentPage = 0;

  const pages = paginate(state.cards, 25);
  const embed = generateEmbed(interaction.user, pages[0], 1, pages.length);
  const row = generateButtons();
  const select = generateDropdown();

  await interaction.update({ embeds: [embed], components: [row, select] });
}

