const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

async function leaderboard(message, ...args) {
    let type = "cards";
    let group = null;

    // Parse arguments
    for (const arg of args) {
        if (arg === "credits" || arg === "cards" || arg === "bal") {
            type = arg === "bal" ? "credits" : arg;
        } else if (arg.startsWith("g=")) {
            group = arg.slice(2).toLowerCase();
        }
    }

    const inventories = fs.readdirSync('./inventory');
    const leaderboardData = [];

    for (const inventory of inventories) {
        const userData = JSON.parse(fs.readFileSync(`./inventory/${inventory}`, 'utf8'));
        const userId = inventory.split(".")[0];

        // Apply group filter
        if (group && (!userData.group || userData.group.toLowerCase() !== group)) {
            continue;
        }

        if (type === "credits") {
            leaderboardData.push({ id: userId, value: userData.syncbank + userData.wallet });
        } else if (type === "cards") {
            let totalCards = 0;
            for (const card of userData.cards) {
                totalCards += card.count;
            }
            leaderboardData.push({ id: userId, value: totalCards });
        }
    }

    leaderboardData.sort((a, b) => b.value - a.value);

    const embed = new EmbedBuilder()
        .setTitle(`${type.toUpperCase()} Leaderboard${group ? ` (Group: ${group})` : ""}`)
        .setColor("#BB52FF")
        .setDescription(
            leaderboardData.slice(0, 20).map((data, index) => `${index + 1}. <@${data.id}> - ${data.value}`).join("\n") || "No data found."
        );

    message.reply({ embeds: [embed] });
}

module.exports = {
    leaderboard
};
