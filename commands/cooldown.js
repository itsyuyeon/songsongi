import fs from 'fs';
import { EmbedBuilder } from 'discord.js';

export function cooldown(message) {
  const userId = message.author.id;
  const username = message.author.username;
  const path = `./inventory/${userId}.json`;

  let inventory;
  try {
    inventory = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch {
    // no inventory file
    return message.reply("No inventory data found.");
  }

  // helper to format ms remaining
  function fmt(ms) {
    if (ms <= 0) return 'Ready';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }

  const dropText      = fmt(inventory.cooldown.drop    - Date.now());
  const claimText     = fmt(inventory.cooldown.claim   - Date.now());
  const paidDropText  = fmt(inventory.cooldown.paidDrop - Date.now());
  const syncText      = fmt(inventory.cooldown.sync    - Date.now());
  const loginText     = fmt(inventory.cooldown.login   - Date.now());

  const embed = new EmbedBuilder()
    .setTitle(`${username}'s Cooldowns`)
    .setColor('#F37B4E')
    .addFields(
      { name: 'Drop',        value: dropText,      inline: false },
      { name: 'Claim',       value: claimText,     inline: false },
      { name: 'Paid Drop',   value: paidDropText,  inline: false },
      { name: 'Sync',        value: syncText,      inline: false },
      { name: 'Login',       value: loginText,     inline: false }
    );

  // if booster or staff add extra fields
  const member = message.member;
  const invCD = inventory.cooldown;

  if (member?.premiumSince) {
    const checkinText      = fmt(invCD.checkin     - Date.now());
    const boostText        = fmt(invCD.boost       - Date.now());
    const boosterDropText  = fmt(invCD.boosterDrop - Date.now());
    const boosterClaimText = fmt(invCD.boosterClaim- Date.now());

    embed.addFields(
      { name: 'Checkin',       value: checkinText,      inline: false },
      { name: 'Boost',         value: boostText,        inline: false },
      { name: 'Booster Drop',  value: boosterDropText,  inline: false },
      { name: 'Booster Claim', value: boosterClaimText, inline: false }
    );
  }

  // no need to re-write inventory here
  return message.channel.send({ embeds: [embed] });
}

export function isCooldown(userId, command) {
  let inventory;
  try {
    inventory = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
  } catch {
    return false;
  }
  return (inventory.cooldown[command] ?? 0) > Date.now();
}

export function cooldownMessage(message, command) {
  const path = `./inventory/${message.author.id}.json`;
  let inventory;
  try {
    inventory = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch {
    return message.reply("No inventory data found.");
  }

  const msLeft = inventory.cooldown[command] - Date.now();
  const m = Math.floor(msLeft / 60000);
  const s = Math.floor((msLeft % 60000) / 1000);

  return message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`You are on cooldown for ${command}`)
        .setDescription(`Wait ${m}m ${s}s before using this again.`)
        .setColor('#F9768C')
    ]
  });
}

export function setCooldown(userId, command, minutes) {
  let inventory;
  const path = `./inventory/${userId}.json`;
  try {
    inventory = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch {
    inventory = { cooldown: {} };
  }

  inventory.cooldown = inventory.cooldown || {};
  // set in ms
  inventory.cooldown[command] = Date.now() + minutes * 60_000;
  fs.writeFileSync(path, JSON.stringify(inventory, null, 2));

  return inventory.cooldown[command];
}
