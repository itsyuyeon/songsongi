import { EmbedBuilder } from 'discord.js';
import db from '../db.js';

export async function balance(message, arg) {
  // figure out whose balance to show
  let targetUser = message.mentions.users.first();
  let targetId;

  if (targetUser) {
    targetId = targetUser.id;
  } else if (arg && /^\d{17,20}$/.test(arg)) {
    targetId = arg;
  } else {
    targetUser = message.author;
    targetId = targetUser.id;
  }

  // fetch from Postgres
  const result = await db.query('SELECT wallet, syncbank FROM users WHERE id = $1', [targetId]);
  if (result.rows.length === 0) {
    // no user in DB
    await message.reply(`<@${targetId}> has no data in the system.`);
    return;
  }

  const { wallet, syncbank } = result.rows[0];

  // if we resolved by ID only, fetch user object for username
  if (!targetUser) {
    try {
      targetUser = await message.client.users.fetch(targetId);
    } catch {
      targetUser = { username: `User ${targetId}` };
    }
  }

  const embed = new EmbedBuilder()
    .setColor('#F9768C')
    .setTitle(`${targetUser.username}'s Balance`)
    .addFields(
      {
        name: 'Wallet:',
        value: `\`${wallet.toLocaleString()}\` <:credits:1357992150457126992>`,
        inline: true
      },
      {
        name: 'Syncbank:',
        value: `\`${syncbank.toLocaleString()}\` <:credits:1357992150457126992>`,
        inline: true
      }
    );

  await message.channel.send({ embeds: [embed] });
}
