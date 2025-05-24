import db from '../db.js';
import fs from 'fs';
import { EmbedBuilder } from 'discord.js';

export async function viewArchive(message) {
  if (!message.member.roles.cache.some(role => role.name === "head admin")) {
    return message.reply('You cannot use this command!');
  }
  const { rows } = await db.query(
    `SELECT DISTINCT series FROM cards WHERE is_archived = TRUE`
  );
  if (rows.length === 0) {
    return message.reply('No archived series found.');
  }
  message.channel.send(`**__Archived series__:**\n\`\`\`${rows.map(r => r.series).join('\n')}\`\`\``);
}

export async function archive(message, series) {
  if (!message.member.roles.cache.some(role => role.name === "head admin")) {
    return message.reply('You cannot use this command!');
  }
  await db.query(
    `UPDATE cards SET is_archived = TRUE WHERE series = $1`,
    [series]
  );
  message.channel.send(`Series "${series}" has been archived.`);
}

export async function unarchive(message, series) {
  if (!message.member.roles.cache.some(role => role.name === "head admin")) {
    return message.reply('You cannot use this command!');
  }
  await db.query(
    `UPDATE cards SET is_archived = FALSE WHERE series = $1`,
    [series]
  );
  message.channel.send(`Series "${series}" has been unarchived.`);
}
