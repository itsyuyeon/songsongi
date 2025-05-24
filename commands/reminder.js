import fs from 'fs';
import path from 'path';
import { EmbedBuilder } from 'discord.js';

const INVENTORY_DIR = path.resolve('./inventory');

// The command‐types we support reminders for:
const REMINDER_TYPES = [
  'drop',
  'claim',
  'paidDrop',
  'sync',
  'login',
  'weekly',   // your booster‐exclusive weekly command
  'booster',  // your booster‐exclusive quick command
  'staff'     // staff‐exclusive reminder
];

/**
 * Toggles global reminders on/off and sets delivery method (ping vs DM).
 * Usage: .reminder on ping
 *        .reminder off
 */
export async function reminder(message, onoff, method) {
  const file = path.join(INVENTORY_DIR, `${message.author.id}.json`);
  const u = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (onoff !== 'on' && onoff !== 'off') {
    return message.reply('usage: `.reminder on <ping|dm>` or `.reminder off`');
  }
  u.reminder.on = (onoff === 'on');

  if (onoff === 'on') {
    if (method === 'ping' || method === 'dm') {
      u.reminder.type = method;
    } else {
      return message.reply('when turning reminders on, specify `ping` or `dm`.');
    }
  }

  fs.writeFileSync(file, JSON.stringify(u, null, 2));
  message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('reminder Settings Updated')
        .setDescription(`reminders are now **${u.reminder.on ? 'ON' : 'OFF'}**`)
        .addFields({ name: 'delivery', value: u.reminder.type, inline: true })
        .setColor('#FFEE52')
    ]
  });
}

/**
 * Schedule a reminder for a specific command type.
 * `type` must be one of REMINDER_TYPES.
 * `minutes` is how many minutes from now to remind.
 */
export async function setReminder(userId, type, minutes) {
  if (!REMINDER_TYPES.includes(type)) return;
  const file = path.join(INVENTORY_DIR, `${userId}.json`);
  const u = JSON.parse(fs.readFileSync(file, 'utf8'));

  u.reminder[type] = Date.now() + minutes * 60 * 1000;
  fs.writeFileSync(file, JSON.stringify(u, null, 2));
}

/**
 * Run this once at startup.  Loops forever every minute,
 * checks each user's reminder slots, and fires any that are due.
 */
export async function reminderLoop(client) {
  while (true) {
    // wait 1 minute
    await new Promise(r => setTimeout(r, 60_000));

    const files = fs.readdirSync(INVENTORY_DIR);
    for (const fname of files) {
      const userId = path.basename(fname, '.json');
      const file = path.join(INVENTORY_DIR, fname);
      const u = JSON.parse(fs.readFileSync(file, 'utf8'));

      if (!u.reminder.on) continue;
      const now = Date.now();

      for (const type of REMINDER_TYPES) {
        const due = u.reminder[type];
        if (due && due < now) {
          // build a reminder embed
          const embed = new EmbedBuilder()
            .setTitle('Reminder')
            .setDescription(`Don’t forget to use the **.${type}** command!`)
            .setColor('#FFEE52');

          // fetch the user & send
          const user = await client.users.fetch(userId);
          if (u.reminder.type === 'ping') {
            user.send({ content: `<@${userId}>`, embeds: [embed] });
          } else {
            user.send({ embeds: [embed] });
          }

          // clear that slot so it doesn’t fire again
          u.reminder[type] = null;
        }
      }

      // persist any changes
      fs.writeFileSync(file, JSON.stringify(u, null, 2));
    }
  }
}
 
