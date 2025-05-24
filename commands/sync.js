import fs from 'fs';
import path from 'path';
import { EmbedBuilder } from 'discord.js';
import { isCooldown, setCooldown } from './cooldown.js';

export async function sync(message) {
  const inventoryPath = path.resolve('./inventory', `${message.author.id}.json`);
  const userData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  const embed = new EmbedBuilder();

  // Check existing cooldown
  if (isCooldown(message.author.id, 'sync')) {
    const remainingMs = userData.cooldown.sync - Date.now();
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);

    embed
      .setTitle("🚧 You're still connected to the last task.")
      .setDescription(
        `Retry in \`${mins}m ${secs}s\`\n\n` +
        `- You've synced **${userData.streak.sync}** times!\n` +
        `- Your current balance is **${userData.wallet}** credits`
      );
  } else {
    // Reset streak if last sync was >24h ago
    const prevSyncTs = userData.cooldown.sync || 0;
    if (Date.now() - prevSyncTs > 24 * 60 * 60 * 1000) {
      userData.streak.sync = 0;
    }

    // Award random credits
    const credits = Math.floor(Math.random() * 151) + 50; // [50–200]
    userData.wallet += credits;
    userData.streak.sync++;

    // Compute next cooldown timestamp
    const nextSync = Date.now() + 60 * 1000;
    userData.cooldown.sync = nextSync;
    setCooldown(message.author.id, 'sync', 60);

    embed
      .setTitle("✅ Sync initiated.")
      .setDescription(
        `**Network task completed!**\n` +
        `You gained **${credits}** credits.\n\n` +
        `- Total syncs: **${userData.streak.sync}**\n` +
        `- New balance: **${userData.wallet}** credits`
      );

    // Persist changes
    fs.writeFileSync(inventoryPath, JSON.stringify(userData, null, 2));
  }

  await message.reply({ embeds: [embed] });
}
