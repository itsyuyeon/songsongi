const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

async function leaderboard(message, type) {
    if (type === undefined || type !== "credits" && type !== "cards") {
        type = "cards";
    }
    const inventories = fs.readdirSync('./inventory');
    const leaderboardData = [];
    for (const inventory of inventories) {
        const userData = JSON.parse(fs.readFileSync(`./inventory/${inventory}`, 'utf8'));
        if (type === "credits") {
            leaderboardData.push({ id: inventory.split(".")[0], credits: userData.ewallet+userData.wallet });
        } else if (type === "cards") {
            var cards = 0;
            for (const card of userData.cards) {
                cards += card.count;
            }
            leaderboardData.push({ id: inventory.split(".")[0], cards: cards });
        }
    }

    leaderboardData.sort((a, b) => b[type] - a[type]);

    const embed = new EmbedBuilder()
        .setTitle(`${type} leaderboard`)
        .setColor("#BB52FF")
        .setDescription(leaderboardData.map((data, index) => `${index + 1}. <@${data.id}> - ${data[type]}`).join("\n"));
    message.reply({ embeds: [embed] });
}


module.exports = {
    leaderboard
};