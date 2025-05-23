const db = require('../db');

async function viewArchive(message) {
  if (!message.member.roles.cache.some(role => role.name === "head admin")) {
    return message.reply('You cannot use this command!');
  }

  const result = await db.query(`SELECT DISTINCT series FROM cards WHERE is_archived = TRUE`);
  if (result.rows.length === 0) return message.reply('No archived series found.');

  const seriesList = result.rows.map(row => row.series).join('\n');
  message.channel.send(`**__Archived series__:**\n\`\`\`${seriesList}\`\`\``);
}

async function archive(message, series) {
  if (!message.member.roles.cache.some(role => role.name === "head admin")) {
    return message.reply('You cannot use this command!');
  }

  await db.query(`UPDATE cards SET is_archived = TRUE WHERE series = $1`, [series]);
  message.channel.send(`Series "${series}" has been archived.`);
}

async function unarchive(message, series) {
  if (!message.member.roles.cache.some(role => role.name === "head admin")) {
    return message.reply('You cannot use this command!');
  }

  await db.query(`UPDATE cards SET is_archived = FALSE WHERE series = $1`, [series]);
  message.channel.send(`Series "${series}" has been unarchived.`);
}

export{
  viewArchive,
  archive,
  unarchive
};
