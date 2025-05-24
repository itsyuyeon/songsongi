// commands/cooldown.js
import fs from 'fs';
import { EmbedBuilder } from 'discord.js';
import path from 'path';

/**
 * Show all of a user’s cooldown timers.
 */
export function cooldown(message) {
  const userId = message.author.id;
  const userDataPath = path.resolve('./inventory', `${userId}.json`);
  if (!fs.existsSync(userDataPath)) {
    return message.reply('No inventory data found.');
  }

  const inv = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
  const now = Date.now();

  const format = ms => ms > 0
    ? `${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s`
    : 'Ready';

  const drop   = format(inv.cooldown.drop   - now);
  const claim  = format(inv.cooldown.claim  - now);
  const pd     = format(inv.cooldown.pd     - now);
  const sync   = format(inv.cooldown.sync   - now);
  const login  = inv.cooldown.login > now
    ? `${Math.floor((inv.cooldown.login-now)/3600000)}h ${Math.floor(((inv.cooldown.login-now)%3600000)/60000)}m`
    : 'Ready';

  const embed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s cooldowns`)
    .setColor('#F37B4E')
    .addFields(
      { name: 'Drop',        value: drop,   inline: false },
      { name: 'Claim',       value: claim,  inline: false },
      { name: 'Paid Drop',   value: pd,     inline: false },
      { name: 'Sync',        value: sync,   inline: false },
      { name: 'Login',       value: login,  inline: false },
    );

  // booster-only cooldowns
  if (message.member?.premiumSince) {
    const checkin       = format(inv.cooldown.checkin       - now);
    const boosterDrop   = format(inv.cooldown.boosterDrop   - now);
    const boosterClaim  = format(inv.cooldown.boosterClaim  - now);
    const boost         = inv.cooldown.boost > now
      ? `${Math.floor((inv.cooldown.boost-now)/3600000)}h ${Math.floor(((inv.cooldown.boost-now)%3600000)/60000)}m`
      : 'Ready';

    embed.addFields(
      { name: 'Boost',         value: boost,       inline: false },
      { name: 'Check-in',      value: checkin,     inline: false },
      { name: 'Booster Drop',  value: boosterDrop, inline: false },
      { name: 'Booster Claim', value: boosterClaim,inline: false },
    );
  }

  return message.reply({ embeds: [embed] });
}

/**
 * Returns true if the given command is still on cooldown for that user.
 */
export function isCooldown(userId, command) {
  const userDataPath = path.resolve('./inventory', `${userId}.json`);
  if (!fs.existsSync(userDataPath)) return false;
  const inv = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
  return (inv.cooldown[command] || 0) > Date.now();
}

/**
 * Tell the user how much time remains on a specific cooldown.
 */
export function cooldownMessage(message, command) {
  const userId = message.author.id;
  const userDataPath = path.resolve('./inventory', `${userId}.json`);
  if (!fs.existsSync(userDataPath)) {
    return message.reply('No inventory data found.');
  }
  const inv = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
  const remaining = inv.cooldown[command] - Date.now();
  const seconds = Math.max(0, Math.floor(remaining / 1000));
  const minutes = Math.floor(seconds / 60);
  const secs     = seconds % 60;

  const embed = new EmbedBuilder()
    .setTitle(`⏳ ${command} cooldown`)
    .setDescription(`Please wait ${minutes}m ${secs}s before using **${command}** again.`)
    .setColor('#F9768C');

  return message.reply({ embeds: [embed] });
}

/**
 * Set a cooldown on a command for a user, in minutes.
 * @returns the timestamp (ms since epoch) when the cooldown will end.
 */
export function setCooldown(userId, command, minutes) {
  const userDataPath = path.resolve('./inventory', `${userId}.json`);
  let inv = { cooldown: {} };
  if (fs.existsSync(userDataPath)) {
    inv = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
  }
  inv.cooldown = inv.cooldown || {};
  inv.cooldown[command] = Date.now() + minutes * 60_000;
  fs.writeFileSync(userDataPath, JSON.stringify(inv, null, 2));
  return inv.cooldown[command];
}
