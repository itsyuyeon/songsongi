// progress.js
import fs from 'fs';
import path from 'path';
import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import db from '../db.js';

export async function progress(message, group) {
  const userId = message.author.id;

  // 1) Verify user exists in DB
  const dbRes = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (dbRes.rows.length === 0) {
    return message.reply(`You haven't synced yet—try \`.start\` first.`);
  }

  // 2) Load local inventory & metadata
  const userData = JSON.parse(
    fs.readFileSync(path.resolve(`./inventory/${userId}.json`), 'utf8')
  );
  const metadata = JSON.parse(
    fs.readFileSync(path.resolve('./cards/metadata.json'), 'utf8')
  );

  // 3) Filter cards matching the “group” keyword
  const re = new RegExp(group, 'i');
  const matched = metadata.filter(card =>
    re.test(card.code) ||
    re.test(card.rarity) ||
    re.test(card.group) ||
    re.test(card.era) ||
    re.test(card.idolname) ||
    re.test(card.series)
  );

  const total = matched.length;
  const collected = matched.filter(c =>
    userData.cards.some(u => u.code === c.code)
  ).length;

  // 4) Build embed
  let colour = '#98b6f6';
  if (group.toUpperCase().startsWith('LTE')) colour = '#b40202';

  const embed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s Progress`)
    .setColor(colour)
    .setDescription(`__You have collected **${collected}** out of **${total}** cards__`)
    .setFooter({
      text: `Completion: ${total > 0 ? Math.round((collected/total)*100) : 0}%`
    });

  // 5) Group by `group` field and list missing
  const byGroup = {};
  for (const card of matched) {
    byGroup[card.group] ??= [];
    byGroup[card.group].push(card);
  }
  for (const grp of Object.keys(byGroup)) {
    const cards = byGroup[grp];
    const missing = cards.filter(c =>
      !userData.cards.some(u => u.code === c.code)
    );
    embed.addFields({
      name: `${grp}: ${cards.length - missing.length}/${cards.length}`,
      value: missing.length
        ? `**Missing:** ${missing.map(c => c.name).join(', ')}\n**Codes:** ${missing.map(c => c.code).join(', ')}`
        : '✅ All collected!'
    });
  }

  // 6) Write out missing codes to a temp file & add export button
  const allMissing = Object.values(byGroup)
    .flat()
    .filter(c => !userData.cards.some(u => u.code === c.code))
    .map(c => c.code);

  const fileName = `missing-${userId}-${Date.now()}.txt`;
  const filePath = path.resolve('./temp', fileName);
  fs.writeFileSync(filePath, allMissing.join('\n') || 'None');

  const exportBtn = new ButtonBuilder()
    .setCustomId('export_missing')
    .setLabel('Export Missing Codes')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(exportBtn);

  // 7) Send embed + collector for the button
  const reply = await message.reply({ embeds: [embed], components: [row] });

  const collector = reply.createMessageComponentCollector({
    filter: i => i.customId === 'export_missing' && i.user.id === userId,
    max: 1,
    time: 60_000
  });

  collector.on('collect', async interaction => {
    await interaction.reply({
      content: `Here is your missing codes list:`,
      files: [filePath],
      ephemeral: true
    });
    setTimeout(() => fs.unlink(filePath, () => {}), 10_000);
  });
}
