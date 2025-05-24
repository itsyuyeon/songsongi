import { EmbedBuilder } from 'discord.js';
import db from '../db.js';

export async function balance(message, arg) {
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
}    
    // Fetch user from database
    const result = await db.query('SELECT * FROM users WHERE id = $1', [targetId]);
    if (result.rows.length === 0) {
        return message.reply(`<@${targetId}> has no data in the system.`);
    }

    const userData = result.rows[0];

    // Fetch user object if not available (for username display)
    if (!targetUser) {
        try {
            targetUser = await message.client.users.fetch(targetId);
        } catch {
            targetUser = { username: `User ID ${targetId}` };
        }
    }

    const embed = new EmbedBuilder()
        .setColor("#F9768C")
        .setTitle(`${targetUser.username}'s Balance`)
        .addFields(
            {
                name: "Wallet:",
                value: `\`${userData.wallet.toLocaleString()}\` <:credits:1357992150457126992>`,
                inline: true
            },
            {
                name: "Syncbank:",
                value: `\`${userData.syncbank.toLocaleString()}\` <:credits:1357992150457126992>`,
                inline: true
            }
        );

    message.channel.send({ embeds: [embed] });