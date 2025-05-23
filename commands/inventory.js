// inventory.js
const fs = require('fs');
const pool = require('./db');

const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const activeInventories = new Map();

function paginate(array, pageSize) {
  return array.reduce((acc, val, i) => {
    const pageIndex = Math.floor(i / pageSize);
    acc[pageIndex] = [...(acc[pageIndex] || []), val];
    return acc;
  }, []);
}

function inventory(message) {
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;
  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
  const userData = JSON.parse(fs.readFileSync(`./inventory/${targetId}.json`, 'utf8'));

  const ownedCodes = new Set(userData.cards.map(c => c.code));
  const cards = metadata.filter(c => ownedCodes.has(c.code));
  const pages = paginate(cards, 25);

  const state = {
    userId: targetId,
    cards,
    currentPage: 0,
    totalPages: pages.length,
    filterType: 'ALL'
  };
  activeInventories.set(message.id, state);

  const embed = generateEmbed(targetUser, pages[0], 1, pages.length);
  const row = generateButtons();
  const select = generateDropdown();

  message.reply({ embeds: [embed], components: [row, select] });
}

function generateEmbed(user, cards, currentPage, totalPages) {
  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Inventory`)
    .setColor('#52A5FF')
    .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

  cards.forEach(card => {
    embed.addFields({ name: `${card.code}`, value: `${card.name} — ${card.group} (${card.rarity})`, inline: false });
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
        new StringSelectMenuOptionBuilder().setLabel('All').setValue('ALL'),
        new StringSelectMenuOptionBuilder().setLabel('3G').setValue('3G'),
        new StringSelectMenuOptionBuilder().setLabel('4G').setValue('4G'),
        new StringSelectMenuOptionBuilder().setLabel('5G').setValue('5G'),
        new StringSelectMenuOptionBuilder().setLabel('LTE').setValue('LTE'),
        new StringSelectMenuOptionBuilder().setLabel('PRISM').setValue('PRISM')
      )
  );
}

function handleInventoryInteraction(interaction) {
  const state = activeInventories.get(interaction.message.id);
  if (!state || interaction.user.id !== state.userId) return interaction.reply({ content: 'This is not your inventory view.', ephemeral: true });

  if (interaction.customId === 'export_codes') {
    const text = state.cards.map(c => c.code).join('\n');
    const filePath = `./temp/inventory_${state.userId}.txt`;
    fs.writeFileSync(filePath, text);
    return interaction.reply({ content: 'Exported card codes:', files: [filePath], ephemeral: true });
  }

  const totalPages = Math.ceil(state.cards.length / 25);

  if (interaction.customId === 'first_page') state.currentPage = 0;
  if (interaction.customId === 'prev_page') state.currentPage = Math.max(0, state.currentPage - 1);
  if (interaction.customId === 'next_page') state.currentPage = Math.min(totalPages - 1, state.currentPage + 1);
  if (interaction.customId === 'last_page') state.currentPage = totalPages - 1;

  const currentCards = paginate(state.cards, 25)[state.currentPage];
  const embed = generateEmbed(interaction.user, currentCards, state.currentPage + 1, totalPages);
  const row = generateButtons();
  const select = generateDropdown();

  interaction.update({ embeds: [embed], components: [row, select] });
}

function handleFilterSelection(interaction) {
  const state = activeInventories.get(interaction.message.id);
  if (!state || interaction.user.id !== state.userId) return;

  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
  const userData = JSON.parse(fs.readFileSync(`./inventory/${state.userId}.json`, 'utf8'));
  const ownedCodes = new Set(userData.cards.map(c => c.code));

  const filter = interaction.values[0];
  const filtered = metadata.filter(c => {
    const owns = ownedCodes.has(c.code);
    return owns && (filter === 'ALL' || c.rarity === filter);
  });

  state.cards = filtered;
  state.currentPage = 0;
  state.totalPages = Math.ceil(filtered.length / 25);
  const currentCards = paginate(state.cards, 25)[0];

  const embed = generateEmbed(interaction.user, currentCards, 1, state.totalPages);
  const row = generateButtons();
  const select = generateDropdown();

  interaction.update({ embeds: [embed], components: [row, select] });
}

module.exports = {
  inventory,
  handleInventoryInteraction,
  handleFilterSelection,
};
