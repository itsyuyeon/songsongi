import fs from 'fs';
import path from 'path';
import { EmbedBuilder } from 'discord.js';

const INVENTORY_DIR = path.resolve('./inventory');

export const REMINDER_TYPES = [
  'drop',
  'claim',
  'paidDrop',
  'sync',
  'login',
  'checkin',   // weekly
  'booster',
  'staff'
];

export async function reminder(message, onoff, method) {
  const file = path.join(INVENTORY_DIR, `${message.author.id}.json`);
  const u = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (!['on','off'].includes(onoff))
    return message.reply('Usage: `.reminder on <ping|dm>` or `.reminder off`');

  u.reminder.on = (onoff === 'on');
  if (u.reminder.on) {
    if (!['ping','dm'].includes(method))
      return message.reply('When turning on, specify `ping` or `dm`.');
    u.reminder.type = method;
  }

  fs.writeFileSync(file, JSON.stringify(u, null, 2));
  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('Reminder Settings Updated')
        .setDescription(`Reminders are now **${u.reminder.on ? 'ON' : 'OFF'}**`)
        .addFields({ name: 'Delivery', value: u.reminder.type, inline: true })
        .setColor('#FFEE52')
    ]
  });
}

export async function setReminder(userId, type, minutes) {
  if (!REMINDER_TYPES.includes(type)) return;
  const file = path.join(INVENTORY_DIR, `${userId}.json`);
  const u = JSON.parse(fs.readFileSync(file, 'utf8'));
  u.reminder[type] = Date.now() + minutes * 60 * 1000;
  fs.writeFileSync(file, JSON.stringify(u, null, 2));
}

let reminderInterval = null;

export function reminderLoop(client) {
  if (reminderInterval) return;  // already running
  reminderInterval = setInterval(async () => {
    const now = Date.now();
    for (const fname of fs.readdirSync(INVENTORY_DIR)) {
      const userId = path.basename(fname, '.json');
      const file = path.join(INVENTORY_DIR, fname);
      let u;
      try {
        u = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        continue;
      }
      if (!u.reminder?.on) continue;
      for (const type of REMINDER_TYPES) {
        const due = u.reminder[type];
        if (due && due <= now) {
          const embed = new EmbedBuilder()
            .setTitle('Reminder')
            .setDescription(`Don’t forget to use **.${type}**`)
            .setColor('#FFEE52');
          const user = await client.users.fetch(userId);
          if (u.reminder.type === 'ping') {
            user.send({ content: `<@${userId}>`, embeds: [embed] });
          } else {
            user.send({ embeds: [embed] });
          }
          u.reminder[type] = null;
        }
      }
      fs.writeFileSync(file, JSON.stringify(u, null, 2));
    }
  }, 60 * 1000);
}

export function stopReminderLoop() {
  clearInterval(reminderInterval);
  reminderInterval = null;
}
