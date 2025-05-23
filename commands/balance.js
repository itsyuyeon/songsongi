const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

async function balance(message, arg) {
    let targetUser = message.mentions.users.first();
    let targetId;

    // Check for user mention
    if (targetUser) {
        targetId = targetUser.id;
    }
    // Check for valid user ID
    else if (arg && /^\d{17,20}$/.test(arg)) {
        targetId = arg;
    } 
    // Default to message author
    else {
        targetUser = message.author;
        targetId = targetUser.id;
    }

    const filePath = `./inventory/${targetId}.json`;
    if (!fs.existsSync(filePath)) {
        return message.reply(`<@${targetId}> has no inventory data.`);
    }

    const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // If not already resolved, fetch user for display
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
}

module.exports = {
    balance
};
