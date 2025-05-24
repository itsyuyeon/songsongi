// commands/profile.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { request } from 'undici';
import _ from 'lodash';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// register your font
GlobalFonts.registerFromPath(
  path.join(__dirname, '../assets/NasalizationRg.otf'),
  'Nasalization'
);

const lastGeneration = new Map();
// how many small slots besides the favourite
const MAX_SLOTS = 8;

export async function profile(message) {
  const userId    = message.author.id;
  const invPath   = `./inventory/${userId}.json`;
  const cacheFile = `./temp/profile_${userId}.png`;

  if (!fs.existsSync(invPath)) {
    return message.channel.send("You haven't started your profile yet!");
  }

  const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 512 });
  const image     = await getCachedOrNewImage(userId, inventory, cacheFile, avatarURL);

  await message.channel.send({ files: [image] });
}

export async function bio(message, text) {
  const userId  = message.author.id;
  const invPath = `./inventory/${userId}.json`;
  if (!fs.existsSync(invPath)) return;

  const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  inventory.profile.bio = text;
  fs.writeFileSync(invPath, JSON.stringify(inventory, null, 2));

  await message.channel.send("Bio updated!");
}

export async function colour(message, part, hex) {
  const userId  = message.author.id;
  const invPath = `./inventory/${userId}.json`;
  if (!fs.existsSync(invPath)) return;

  const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
  if (!hexRegex.test(hex)) {
    return message.channel.send("Invalid hex code! Use `#RRGGBB` or `#RGB`.");
  }

  switch (part) {
    case 'text':        inventory.profile.text       = hex; break;
    case 'background1': inventory.profile.background1 = hex; break;
    case 'background2': inventory.profile.background2 = hex; break;
    case 'border1':     inventory.profile.border1     = hex; break;
    case 'border2':     inventory.profile.border2     = hex; break;
    default:
      return message.channel.send(
        "Invalid part! Use `.colour <text|background1|background2|border1|border2> <hex>`"
      );
  }

  fs.writeFileSync(invPath, JSON.stringify(inventory, null, 2));
  await message.channel.send("Colour updated!");
}

/**
 * Sets your favourite card (big image) if `slot` is null,
 * or one of your small slots if `slot` is 1–MAX_SLOTS.
 */
export async function profileCard(message, cardCode, slot = null) {
  const userId = message.author.id;
  const invPath = `./inventory/${userId}.json`;
  const mdPath  = `./cards/metadata.json`;

  if (!fs.existsSync(invPath) || !fs.existsSync(mdPath)) {
    return message.channel.send("You or the card metadata is missing!");
  }

  const inventory = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const metadata  = JSON.parse(fs.readFileSync(mdPath, 'utf8'));
  const card      = metadata.find(c => c.code === cardCode);

  if (!card) {
    return message.channel.send(`Card \`${cardCode}\` not found!`);
  }

  if (slot === null) {
    // favourite
    inventory.profile.favorite = card.code;
    await message.channel.send(`🌟 Favourite card set to \`${card.code}\`!`);
  } else {
    // slots
    const idx = parseInt(slot, 10);
    if (isNaN(idx) || idx < 1 || idx > MAX_SLOTS) {
      return message.channel.send(`Slot must be a number between 1 and ${MAX_SLOTS}.`);
    }
    inventory.profile.slots = inventory.profile.slots || Array(MAX_SLOTS).fill('');
    inventory.profile.slots[idx - 1] = card.code;
    await message.channel.send(`Slot ${idx} updated to \`${card.code}\`!`);
  }

  fs.writeFileSync(invPath, JSON.stringify(inventory, null, 2));
}

async function getCachedOrNewImage(userId, inventory, cachePath, avatarURL) {
  if (_.isEqual(lastGeneration.get(userId), inventory) && fs.existsSync(cachePath)) {
    console.log("Using cached profile image");
    return new AttachmentBuilder(cachePath);
  }
  lastGeneration.set(userId, inventory);

  // --- build your canvas ---
  const canvas = createCanvas(5366, 3200);
  const ctx    = canvas.getContext('2d');
  ctx.font           = '100px Nasalization';
  ctx.textAlign      = 'center';
  ctx.fillStyle      = inventory.profile.text;

  // draw base frame
  const background = await loadImage(path.join(__dirname, '../assets/BlankFrame(SolidFrame).png'));
  ctx.drawImage(background, 0, 0);

  // recolor pixels, draw avatar, draw text, etc...
  // (your existing drawing logic would go here)
  //
  // Draw favourite card in big slot:
  if (inventory.profile.favorite) {
    const favPath = `./cards/${inventory.profile.favorite}.png`;
    if (fs.existsSync(favPath)) {
      const favImg = await loadImage(favPath);
      ctx.drawImage(favImg, /* x= */ 200, /* y= */ 500, /* w= */ 800, /* h= */ 800);
    }
  }

  // Draw small slots grid:
  const slots = inventory.profile.slots || [];
  for (let i = 0; i < Math.min(slots.length, MAX_SLOTS); i++) {
    const code = slots[i];
    if (!code) continue;
    const imgPath = `./cards/${code}.png`;
    if (!fs.existsSync(imgPath)) continue;
    const img = await loadImage(imgPath);
    // example grid: 4 across, 2 down
    const slotX = 1000 + (i % 4) * 600;
    const slotY = 1000 + Math.floor(i / 4) * 850;
    const w     = Math.round(img.width * 0.4);
    const h     = Math.round(img.height * 0.4);
    ctx.drawImage(img, slotX, slotY, w, h);
  }

  // draw avatar
  const { body } = await request(avatarURL);
  const avatar   = await loadImage(await body.arrayBuffer());
  ctx.drawImage(avatar, 1836, 450, 391, 391);

  // your remaining draw calls...
  // e.g. streak, wallet, hoardlist, etc.

  // write out file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(cachePath, buffer);
  return new AttachmentBuilder(cachePath);
}

export {
  profile,
  bio,
  colour,
  profileCard
};
