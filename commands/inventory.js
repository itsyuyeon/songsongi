// commands/inventory.js
import fs from 'fs';
import path from 'path';
import {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

// In-memory state for each inventory view (message.id → state)
const activeInventories = new Map();

/** Break an array into pages of size N */
function paginate(array, pageSize) {
  return array.reduce((pages, item, i) => {
    const idx = Math.floor(i / pageSize);
    pages[idx] = pages[idx] || [];
    pages[idx].push(item);
    return pages;
  }, []);
}

/** Sends the first page + controls */
export async function inventory(message) {
  const targetUser = message.mentions.users.first() || message.author;
  const targetId = targetUser.id;

  // Load metadata & userData
  const metadataPath = path.resolve(process.cwd(), 'cards/metadata.json');
  const invPath      = path.resolve(process.cwd(), `inventory/${targetId}.json`);
  if (!fs.existsSync(invPath)) {
    return message.reply(`<@${targetId}> has no inventory.`);
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const userData = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  // Build list of owned cards
  const owned = new Set(userData.cards.map(c => c.code));
  const cards = metadata.filter(c => owned.has(c.code));
  const pages = paginate(cards, 25);
  if (pages.length === 0) {
    return message.reply(`${targetUser.username} owns no cards.`);
  }

  // Save state
  activeInventories.set(message.id, {
    userId: targetId,
    cards,
    currentPage: 0
  });

  // Reply with page-1
  const embed = generateEmbed(targetUser, pages[0], 1, pages.length);
  const row   = generateButtons();
  const menu  = generateDropdown();
  await message.reply({ embeds: [embed], components: [row, menu] });
}

/** Handles page buttons & export */
export async function handleInventoryInteraction(interaction) {
  const state = activeInventories.get(interaction.message.id);
  if (!state || interaction.user.id !== state.userId) {
    return interaction.reply({ content: 'This is not your inventory view.', ephemeral: true });
  }

  const pages = paginate(state.cards, 25);
  const total = pages.length;

  switch (interaction.customId) {
    case 'export_codes': {
      const text = state.cards.map(c => c.code).join('\n');
      const file = path.resolve(process.cwd(), `temp/inventory_${state.userId}.txt`);
      fs.writeFileSync(file, text);
      return interaction.reply({ content: 'Here are all your codes:', files: [file], ephemeral: true });
    }
    case 'first_page':
      state.currentPage = 0;
      break;
    case 'prev_page':
      state.currentPage = Math.max(0, state.currentPage - 1);
      break;
    case 'next_page':
      state.currentPage = Math.min(total - 1, state.currentPage + 1);
      break;
    case 'last_page':
      state.currentPage = total - 1;
      break;
    default:
      return; // ignore
  }

  const embed = generateEmbed(
    interaction.user,
    pages[state.currentPage],
    state.currentPage + 1,
    total
  );
  await interaction.update({ embeds: [embed], components: [generateButtons(), generateDropdown()] });
}

/** Handles rarity filter dropdown */
export async function handleFilterSelection(interaction) {
  const state = activeInventories.get(interaction.message.id);
  if (!state || interaction.user.id !== state.userId) {
    return interaction.reply({ content: 'Not allowed.', ephemeral: true });
  }

  const filter = interaction.values[0]; // ALL / 3G / 4G / 5G / LTE / PRISM
  const metadataPath = path.resolve(process.cwd(), 'cards/metadata.json');
  const invPath      = path.resolve(process.cwd(), `inventory/${state.userId}.json`);
  const metadata     = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const userData     = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  const owned = new Set(userData.cards.map(c => c.code));
  state.cards = metadata.filter(c =>
    owned.has(c.code) && (filter === 'ALL' || c.rarity === filter)
  );
  state.currentPage = 0;

  const pages = paginate(state.cards, 25);
  const total = pages.length || 1;
  const embed = generateEmbed(interaction.user, pages[0], 1, total);

  await interaction.update({
    embeds: [embed],
    components: [generateButtons(), generateDropdown()]
  });
}

/** Helpers to build Embed / Buttons / Dropdown */
function generateEmbed(user, cards, page, totalPages) {
  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Inventory`)
    .setColor('#52A5FF')
    .setFooter({ text: `Page ${page} of ${totalPages}` });

  cards.forEach(c => {
    embed.addFields({
      name: c.code,
      value: `${c.name} — ${c.group} (${c.rarity})`,
      inline: false
    });
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
        { label: 'All',   value: 'ALL' },
        { label: '3G',    value: '3G' },
        { label: '4G',    value: '4G' },
        { label: '5G',    value: '5G' },
        { label: 'LTE',   value: 'LTE' },
        { label: 'PRISM', value: 'PRISM' }
      )
  );
}
