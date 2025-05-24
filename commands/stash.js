import fs from 'fs';
import { EmbedBuilder } from 'discord.js';
import { loadInventory } from '../lib/inventory.js';   // ← adjust path if you placed it somewhere else

export function stash(message) {
    const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Stash`)
        .setColor('#52A5FF');

    const userId = message.author.id;

    if (fs.existsSync(`./inventory/${userId}.json`)) {
        const userData = loadInventory(userId);
            // ... work with userData ...
            // when you update it, write back:
            fs.writeFileSync(
            `./inventory/${userId}.json`,
            JSON.stringify(userData, null, 2)
            );
        if (userData.cardpacks.length > 0) {
            // Count duplicate packs
            const packCounts = {};
            userData.cardpacks.forEach(pack => {
                packCounts[pack.name] = (packCounts[pack.name] || 0) + 1;
            });

            // Add unique packs with their counts
            for (const [packName, count] of Object.entries(packCounts)) {
            const pack = userData.cardpacks.find(p => p.name === packName);
            embed.addFields({
                name: `**${pack.name}** - \`${count}\``,
                value: ``,
                inline: false
            });
            }
        } else {
            embed.setDescription('You do not have any card packs!');
        }
    } else {
        embed.setDescription('You do not have any card packs!');
    }
    message.reply({ embeds: [embed] });
}
