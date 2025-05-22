const fs = require('fs');
const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

function inventory(message, filter) {
    let targetUser = message.mentions.users.first();
    let targetId;

    // Check for mention or user ID
    if (targetUser) {
        targetId = targetUser.id;
    } else if (filter && /^\d{17,20}$/.test(filter)) {
        targetId = filter;
    } else {
        targetUser = message.author;
        targetId = targetUser.id;
    }

    if (!fs.existsSync(`./inventory/${targetId}.json`)) {
        return message.reply(`<@${targetId}> has no inventory.`);
    }

    const userData = JSON.parse(fs.readFileSync(`./inventory/${targetId}.json`, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));

    const embed = new EmbedBuilder()
        .setTitle(`${targetUser ? targetUser.username : 'User'}'s Inventory`)
        .setColor('#52A5FF');

    if (!filter || /^\d{17,20}$/.test(filter)) {
        let SIGNAL = 0, LTE = 0, PRISM = 0;
        userData.cards.forEach(card => {
            const cardData = metadata.find(c => c.code === card.code);
            if (!cardData) return;
            if (["3G", "4G", "5G"].includes(cardData.rarity)) SIGNAL += card.count;
            else if (cardData.rarity === "LTE") LTE += card.count;
            else if (cardData.rarity === "PRISM") PRISM += card.count;
        });

        embed.addFields({
            name: 'Summary',
            value: `**SIGNAL** - \`${SIGNAL}\`\n**LTE** - \`${LTE}\`\n**PRISM** - \`${PRISM}\``,
            inline: true
        });
    } else {
        const key = filter.split('=')[1];
        let groupedCards = new Map();

        userData.cards.forEach(card => {
            const cardData = metadata.find(c => c.code === card.code);
            if (!cardData) return;
            let include = false;
            switch (filter[0]) {
                case 'g': include = cardData.group?.toLowerCase().includes(key.toLowerCase()); break;
                case 'n': include = cardData.name?.toLowerCase().includes(key.toLowerCase()); break;
                case 'r': include = cardData.rarity?.toLowerCase() === key.toLowerCase(); break;
            }
            if (include) {
                const groupKey = `${cardData.group} - ${cardData.era}`;
                const display = `${cardData.code} ${cardData.name} - \`${card.count}\``;
                if (!groupedCards.has(groupKey)) groupedCards.set(groupKey, []);
                groupedCards.get(groupKey).push(display);
            }
        });

        for (let [group, cards] of groupedCards) {
            embed.addFields({ name: `**${group}**`, value: cards.join('\n'), inline: false });
        }
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId('filter')
        .setPlaceholder('Rarity Filter')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('SIGNAL CARDS').setValue('SIGNAL'),
            new StringSelectMenuOptionBuilder().setLabel('LTE CARDS').setValue('LTE'),
            new StringSelectMenuOptionBuilder().setLabel('PRISM CARDS').setValue('PRISM')
        );

    const row = new ActionRowBuilder().addComponents(select);
    message.reply({ embeds: [embed], components: [row] });
}

function filter(interaction) {
    const rarity = interaction.values[0];
    const userId = interaction.user.id;
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));

    const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s Inventory`)
        .setColor('#52A5FF');

    let groupedCards = new Map();
    userData.cards.forEach(card => {
        const cardData = metadata.find(c => c.code === card.code);
        if (!cardData) return;

        const isMatch =
            (rarity === 'SIGNAL' && ['3G', '4G', '5G'].includes(cardData.rarity)) ||
            (cardData.rarity === rarity);

        if (isMatch) {
            const groupKey = `${cardData.group} - ${cardData.era}`;
            const display = `${cardData.code} ${cardData.name} - \`${card.count}\``;
            if (!groupedCards.has(groupKey)) groupedCards.set(groupKey, []);
            groupedCards.get(groupKey).push(display);
        }
    });

    for (let [group, cards] of groupedCards) {
        embed.addFields({ name: `**${group}**`, value: cards.join('\n'), inline: false });
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId('filter')
        .setPlaceholder('Rarity Filter')
        .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('SIGNAL CARDS').setValue('SIGNAL'),
            new StringSelectMenuOptionBuilder().setLabel('LTE CARDS').setValue('LTE'),
            new StringSelectMenuOptionBuilder().setLabel('PRISM CARDS').setValue('PRISM')
        );

    const row = new ActionRowBuilder().addComponents(select);
    interaction.update({ embeds: [embed], components: [row] });
}

module.exports = {
    inventory,
    filter
};
