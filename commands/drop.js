import fs from 'fs';
import path from 'path';
import { AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { setReminder } from './commands/reminder.js';   // <-- import the scheduler

// Store active drops and last claim timestamps
export const activeDrops = new Map();
export const lastClaimTimestamps = new Map();

/**
 * Initiates a server drop of random cards.
 */

export async function drop(message) {
  const userId = message.author.id;
  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'))
    setReminder(userId, 'drop', 5 * 60);  

    .filter(c => !c.archived);
  if (metadata.length < 3) {
    await message.reply('not enough cards available for a drop.');
    return;
  }

  // Select 3 random cards
  const selectedCards = getRandomCards(metadata, 3);
  // Generate an image showing the cards
  const cacheName = `drop_${selectedCards.map(c => c.code).join('_')}.png`;
  const cachePath = path.resolve('./temp', cacheName);
  const attachment = await getCachedOrNewImage(selectedCards, cachePath);

  // Create buttons for each card
  const buttons = new ActionRowBuilder().addComponents(
    selectedCards.map(card =>
      new ButtonBuilder()
        .setCustomId(`pick_${card.code}`)
        .setLabel(`${card.code} ${card.name}`)
        .setStyle(ButtonStyle.Secondary)
    )
  );

  // Send embed
  const embed = new EmbedBuilder()
    .setTitle('Scanning complete')
    .setDescription(`@${message.author.username}, choose your connection!`)
    .setColor('#52A5FF')
    .setImage(`attachment://${cacheName}`);

  const reply = await message.reply({ embeds: [embed], files: [attachment], components: [buttons] });

  // Save drop state
  activeDrops.set(reply.id, {
    userId,
    codes: selectedCards.map(c => c.code),
    timestamp: Date.now(),
    bannedUsers: []
  });

  // Expire after 3 minutes
  setTimeout(() => {
    if (activeDrops.has(reply.id)) {
      activeDrops.delete(reply.id);
      reply.edit({ content: 'Drop expired!', components: [] }).catch(console.error);
    }
  }, 3 * 60 * 1000);
}

/**
 * Handles button interaction for claiming a drop.
 */
export async function handleButtonInteraction(interaction) {
  const dropInfo = activeDrops.get(interaction.message.id);

  if (!dropInfo) {
    await interaction.reply({ content: 'This drop has expired!', ephemeral: true });
    return;
  }

  const now = Date.now();
  const last = lastClaimTimestamps.get(interaction.user.id) || 0;
  if (now - last < 5 * 60 * 1000) {
    const remaining = Math.ceil((5 * 60 * 1000 - (now - last)) / 1000);
    await interaction.reply({ content: `you must wait **${remaining}s** before claiming again.`, ephemeral: true });
    return;
  }

  if (dropInfo.bannedUsers.includes(interaction.user.id)) {
    await interaction.reply({ content: 'you have already claimed from this drop!', ephemeral: true });
    return;
  }

    // schedule the next “go claim another one” ping in 5 minutes:
  setReminder(interaction.user.id, 'claim', 5 * 60);

  const elapsed = now - dropInfo.timestamp;
  const isOwner = interaction.user.id === dropInfo.userId;
  if (elapsed < 30 * 1000 && !isOwner) {
    const wait = Math.ceil((30 * 1000 - elapsed) / 1000);
    await interaction.reply({ content: `wait ${wait}s before claiming someone else's drop!`, ephemeral: true });
    return;
  }

  // Process claim
  const code = interaction.customId.split('_')[1];
  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
  const card = metadata.find(c => c.code === code);

  // Send claim message
  const messages = {
        '3G': `<@${interaction.user.id}> detected a **weak signal** — \`${code}\` locked!`,
        '4G': `<@${interaction.user.id}> established a **stable connection**. Signal received: \`${code}\``,
        '5G': `<@${interaction.user.id}> achieved a **high-speed sync**! Card unlocked: \`${code}\``,
        'PRISM': `<@${interaction.user.id}> unlocked a **Dear Diary** entry: \`${code}\`!`
  };
  await interaction.reply({ content: `<@${interaction.user.id}> ${messages[card.rarity]}`, ephemeral: false });

  // Update user inventory
  const invPath = `./inventory/${interaction.user.id}.json`;
  const userData = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const existing = userData.cards.find(c => c.code === code);
  if (existing) existing.count++;
  else userData.cards.push({ code, count: 1 });

  // Save inventory
  fs.writeFileSync(invPath, JSON.stringify(userData, null, 2));

  // Mark claim
  lastClaimTimestamps.set(interaction.user.id, now);
  dropInfo.bannedUsers.push(interaction.user.id);
}

/**
 * Paid drop with pity system.
 */
export async function paidDrop(message) {
  const userId = message.author.id;
  const invPath = `./inventory/${userId}.json`;
  const userData = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  if (userData.wallet < 250) {
    await message.reply('insufficient credits.');
    return;
  }
  userData.wallet -= 250;
  userData.paidDropCount = (userData.paidDropCount || 0) + 1;

  // Determine pity rate
  let prismRate = 10;
  if (userData.paidDropCount >= 15) prismRate = 30;
  if (userData.paidDropCount >= 20) prismRate = 100;

  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'))
    .filter(c => !c.archived);
  const weights = { '5G': 30, '4G': 50, '3G': 70, 'PRISM': prismRate };
  const card = getRandomCardWithWeights(metadata, weights);

  // Add to inventory
  const idx = userData.cards.findIndex(c => c.code === card.code);
  if (idx !== -1) userData.cards[idx].count++;
  else userData.cards.push({ code: card.code, count: 1 });

  if (card.rarity === 'PRISM') userData.paidDropCount = 0;
  fs.writeFileSync(invPath, JSON.stringify(userData, null, 2));

  // Reply embed
  const colorMap = { '3G': '#81b8ff', '4G': '#ffb381', '5G': '#b981ff', 'PRISM': '#c6deff' };
  const embed = new EmbedBuilder()
    .setColor(colorMap[card.rarity])
    .setTitle('🎴 Paid Card Dropped!')
    .setImage(`attachment://${card.code}.png`)
    .setDescription(`You spent 250 credits and received: \`${card.code}\`\nRemaining Balance: \`${userData.wallet}\``);
  const img = new AttachmentBuilder(path.resolve(__dirname, `../cards/${card.code}.png`));
  await message.reply({ embeds: [embed], files: [img] });

      setReminder(userId, 'pd', 0.5); // 0.5 minutes = 30s

}

/**
 * Helper: weighted random card.
 */
function getRandomCardWithWeights(metadata, weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const rarity of Object.keys(weights)) {
    r -= weights[rarity];
    if (r <= 0) {
      const pool = metadata.filter(c => c.rarity === rarity);
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return metadata[Math.floor(Math.random() * metadata.length)];
}

/**
 * Helper: select multiple distinct random cards by rarity.
 */
function getRandomCards(metadata, count) {
  const weights = { '3G': 70, '4G': 50, '5G': 30, 'PRISM': 10 };
  const pool = [...metadata];
  const out = [];
  for (let i = 0; i < count; i++) {
    const card = getRandomCardWithWeights(pool, weights);
    out.push(card);
    pool.splice(pool.indexOf(card), 1);
  }
  return out;
}

/**
 * Helper: cache or regenerate composite image of cards.
 */
async function getCachedOrNewImage(cards, cachePath) {
  if (fs.existsSync(cachePath)) {
    return new AttachmentBuilder(cachePath);
  }
  const canvas = createCanvas(2300, 1000);
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < cards.length; i++) {
    const img = await loadImage(`./cards/${cards[i].code}.png`);
    const w = img.width * 0.5;
    const h = img.height * 0.5;
    ctx.drawImage(img, i * (w + 20), 0, w, h);
  }
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(cachePath, buffer);
  return new AttachmentBuilder(cachePath);
}
