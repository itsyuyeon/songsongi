const fs = require('fs');
const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} = require('discord.js');
/*
function inventory(message, cardId) {
    if (cardId == undefined) {
        const embed = new EmbedBuilder()
            .setTitle('Inventory')
            .setDescription('Your cards and coins')
            .setColor('#0099ff');

        const userId = message.author.id;
        var cards = fs.readdirSync('./cards')

        if (fs.existsSync(`./inventory/${userId}.json`)) {
            const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
            embed.addFields({ name: 'Coins', value: `${userData.coins}`, inline: true });
            userData.cards.forEach(card => {
                cards.forEach(file => {
                    var rarity = parseInt(file.split('_')[0][0]);
                    if      (rarity == 1) {rarity = '1 Star (common)';}
                    else if (rarity == 2) {rarity = '2 Star (rare)';}
                    else if (rarity == 3) {rarity = '3 Star (legendary)';}
                    if (file.split('_')[2] == card.id) {
                        embed.addFields({ name: `${file.split('_')[1]} #${card.id}`, value: `**Amount:** x${card.count}\n **Rarity:** ${rarity}`, inline: false });
                    }
                });
            });
        } else {
            embed.setDescription('You do not have any cards!');
        }

        const select = new StringSelectMenuBuilder()
                .setCustomId('filter')
                .setPlaceholder('Filter through your cards based on rarity')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('1 Star')
                        .setDescription('common')
                        .setValue('1'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('2 Star')
                        .setDescription('rare')
                        .setValue('2'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('3 Star')
                        .setDescription('legendary')
                        .setValue('3'),
                );

            const row = new ActionRowBuilder()
                .addComponents(select);


        message.reply({ embeds: [embed], components: [row] });
    } else {
        // check if the cardId is valid by looking for the card in the cards folder
        var validCard = false;
        var cardPath = '';
        if (cardId.startsWith('#')) {
            cardId = cardId.replace(/#/g, '');
        }
        fs.readdirSync('./cards').forEach(file => {
            if (file.split('_')[2] == cardId) {
                validCard = true;
                cardPath = `./cards/${file}`;
            }
        });
        if (!validCard) {
            message.reply('Invalid card ID!');
            return;
        }
        // create attachment for the card
        const attachment = new AttachmentBuilder(cardPath)
            .setName(cardPath.split('/')[2]);

        const embed = new EmbedBuilder()
            .setTitle('Card information')
            .setImage(`attachment://${cardPath.split('/')[2]}`)
            .setColor('#0099ff');

        const userId = message.author.id;
        var cards = fs.readdirSync('./cards')

        if (fs.existsSync(`./inventory/${userId}.json`)) {
            const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
            var userscards = userData.cards.find(card => card.id == cardId);
            if (userscards) {
                embed.setDescription(`**${cardPath.split('_')[1]} #${cardId}**\n **Amount:** x${userscards.count}\n **Rarity:** ${attachment.name.split('_')[0][0]} Star`);
            } else {
                embed.setDescription('You do not have this card!');
            }
        } else {
            embed.setDescription('You do not have any cards!');
        }

        message.reply({ embeds: [embed], files: [attachment] });
    }
}
*/

function inventory(message, filter) {
    if (filter == undefined) {
        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username}'s Inventory`)
            .setColor('#52A5FF');

        const userId = message.author.id;
        var SIGNAL = 0;
        var LTE = 0;
        var PRISM = 0;

        if (fs.existsSync(`./inventory/${userId}.json`)) {
            const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
            const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));

            userData.cards.forEach(card => {
                metadata.forEach(cardData => {
                    if (cardData.code == card.code) {
                        if (cardData.rarity == '3G' || cardData.rarity == '4G' || cardData.rarity == '5G') {
                            SIGNAL += card.count;
                        } else if (cardData.rarity == 'LTE') {
                            LTE += card.count;
                        } else if (cardData.rarity == 'PRISM') {
                            PRISM += card.count;
                        }
                    }
                })
            });
        }
        embed.addFields(
            { name: '', value: `**SIGNAL** - \`${SIGNAL}\`\n**LTE** - \`${LTE}\`\n**PRISM** - \`${PRISM}\``, inline: true }
        );

        const select = new StringSelectMenuBuilder()
            .setCustomId('filter')
            .setPlaceholder('Rarity Filter')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('SIGNAL CARDS')
                    .setValue('SIGNAL'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('LTE CARDS')
                    .setValue('LTE'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('PRISM CARDS')
                    .setValue('PRISM'),
            );

        const row = new ActionRowBuilder()
            .addComponents(select);

        message.reply({
            embeds: [embed],
            components: [row]
        });
    } else {
        const key = filter.split('=')[1];
        const userId = message.author.id;
        const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
        const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username}'s Inventory`)
            .setColor('#52A5FF');
        let groupedCards = new Map();

        switch (filter[0]) {
            case "g":// group
                userData.cards.forEach(card => {
                    metadata.forEach(cardData => {
                        if (cardData.code == card.code && cardData.group.includes(key)) {
                            let group = groupedCards.get(`${cardData.group} - ${cardData.era}`) || [];
                            group.push(`${cardData.code} ${cardData.name} - \`${card.count}\``);
                            groupedCards.set(`${cardData.group} - ${cardData.era}`, group);
                        }
                    });
                });
                break;
            case "n":// name
                userData.cards.forEach(card => {
                    metadata.forEach(cardData => {
                        if (cardData.code == card.code && cardData.name.includes(key)) {
                            let group = groupedCards.get(`${cardData.group} - ${cardData.era}`) || [];
                            group.push(`${cardData.code} ${cardData.name} - \`${card.count}\``);
                            groupedCards.set(`${cardData.group} - ${cardData.era}`, group);
                        }
                    });
                });
                break;
            case "p":// print
                break;
            case "e":// event
                break;
            case "r"://rarity
                userData.cards.forEach(card => {
                    metadata.forEach(cardData => {
                        if (cardData.code == card.code && cardData.rarity.includes(key)) {
                            let group = groupedCards.get(`${cardData.group} - ${cardData.era}`) || [];
                            group.push(`${cardData.code} ${cardData.name} - \`${card.count}\``);
                            groupedCards.set(`${cardData.group} - ${cardData.era}`, group);
                        }
                    });
                });
                break;
            default:
                break;
        }
        // Add fields for each group
        for (let [group, cards] of groupedCards) {
            embed.addFields({
                name: `**${group}**`,
                value: cards.join('\n'),
                inline: false
            });
        }
        
        const select = new StringSelectMenuBuilder()
            .setCustomId('filter')
            .setPlaceholder('Rarity Filter')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('SIGNAL CARDS')
                    .setValue('SIGNAL'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('LTE CARDS')
                    .setValue('LTE'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('PRISM CARDS')
                    .setValue('PRISM'),
            );
        const row = new ActionRowBuilder()
            .addComponents(select);

        message.reply({
            embeds: [embed],
            components: [row]
        });
    }
}

function filter(interaction) {
    //edit the inventory message to show only the cards with the selected rarity
    const rarity = interaction.values[0];

    const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s Inventory`)
        .setColor('#52A5FF');

    const userId = interaction.user.id;
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));

    // Create a map to group cards by group name
    let groupedCards = new Map();

    userData.cards.forEach(card => {
        metadata.forEach(cardData => {
            if (cardData.code == card.code) {
                if (((cardData.rarity == '3G' || cardData.rarity == '4G' || cardData.rarity == '5G') && rarity == 'SIGNAL') || rarity == cardData.rarity) {
                    // Get or create array for this group
                    let group = groupedCards.get(`${cardData.group} - ${cardData.era}`) || [];
                    group.push(`${cardData.code} ${cardData.name} - \`${card.count}\``);
                    groupedCards.set(`${cardData.group} - ${cardData.era}`, group);
                }
            }
        });
    });

    // Add fields for each group
    for (let [group, cards] of groupedCards) {
        embed.addFields({
            name: `**${group}**`,
            value: cards.join('\n'),
            inline: false
        });
    }
    
    const select = new StringSelectMenuBuilder()
    .setCustomId('filter')
    .setPlaceholder('Rarity Filter')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('SIGNAL CARDS')
            .setValue('SIGNAL'),
        new StringSelectMenuOptionBuilder()
            .setLabel('LTE CARDS')
            .setValue('LTE'),
        new StringSelectMenuOptionBuilder()
            .setLabel('PRISM CARDS')
            .setValue('PRISM'),
    );

    const row = new ActionRowBuilder().addComponents(select);
    interaction.update({
        embeds: [embed],
        components: [row]
    });
}

module.exports = {
    inventory,
    filter
};