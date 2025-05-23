const { EmbedBuilder } = require('discord.js');
import fs from 'fs';

function parseArgs(content) {
    const args = content.split(/\s+/);
    const filters = {
        type: 'cards',
        group: null,
        era: null,
        series: null,
        rarity: null,
        idol: null,
        top: 10
    };

    args.forEach(arg => {
        if (arg.startsWith('g=')) filters.group = arg.slice(2).toLowerCase();
        else if (arg.startsWith('era=')) filters.era = arg.slice(4).toLowerCase();
        else if (arg.startsWith('series=')) filters.series = arg.slice(7).toLowerCase();
        else if (arg.startsWith('rarity=')) filters.rarity = arg.slice(7).toLowerCase();
        else if (arg.startsWith('idol=')) filters.idol = arg.slice(5).toLowerCase();
        else if (arg.startsWith('top=')) filters.top = parseInt(arg.slice(4));
        else if (["cards", "credits", "bal"].includes(arg.toLowerCase())) {
            filters.type = arg.toLowerCase() === 'bal' ? 'credits' : arg.toLowerCase();
        }
    });

    return filters;
}

async function leaderboard(message, rawArgs) {
    const { type, group, era, series, rarity, idol, top } = parseArgs(rawArgs);
    const inventories = fs.readdirSync('./inventory');
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));

    const filteredCards = metadata.filter(card => {
        if (group && card.group?.toLowerCase() !== group) return false;
        if (era && card.era?.toLowerCase() !== era) return false;
        if (series && card.series?.toLowerCase() !== series) return false;
        if (rarity && card.rarity?.toLowerCase() !== rarity) return false;
        if (idol && card.idolname?.toLowerCase() !== idol) return false;
        return true;
    });

    const leaderboardData = [];

    for (const file of inventories) {
        const userId = file.replace('.json', '');
        const userData = JSON.parse(fs.readFileSync(`./inventory/${file}`, 'utf8'));

        if (type === 'credits') {
            leaderboardData.push({ id: userId, value: userData.wallet + userData.syncbank });
        } else {
            // type: cards
            let count = 0;
            for (const owned of userData.cards) {
                if (!group && !era && !series && !rarity && !idol) {
                    count += owned.count;
                } else if (filteredCards.find(c => c.code === owned.code)) {
                    count += owned.count;
                }
            }
            leaderboardData.push({ id: userId, value: count });
        }
    }

    leaderboardData.sort((a, b) => b.value - a.value);
    const topData = leaderboardData.slice(0, top).filter(entry => entry.value > 0);

    const titleType = type === 'credits' ? 'BALANCE' : 'CARDS';
    const filterText = [group, era, series, rarity, idol].filter(Boolean).join(' / ');
    const embed = new EmbedBuilder()
        .setTitle(`${titleType} Leaderboard${filterText ? ` (${filterText})` : ''}`)
        .setColor("#BB52FF");

    if (topData.length === 0) {
        embed.setDescription("No data found.");
    } else {
        embed.setDescription(topData.map((entry, i) => `${i + 1}. <@${entry.id}> - ${entry.value}`).join("\n"));
    }

    message.reply({ embeds: [embed] });
}

export{ leaderboard };
