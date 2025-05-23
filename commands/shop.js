const fs = require('fs');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

function shop(message) {
    const shopData = JSON.parse(fs.readFileSync('./shop/shop.json', 'utf8'));

    const itemEmotes = {
        "BYTE": "<:bytepack:1358092889904906400>",
        "CORE": "<:corepack:1358092894224908298>",
        "HYPER": "<:hyperpack:1358092898863808604>"
    };

    let description = "";
    const buttons = [];

    shopData.forEach(item => {
        // Support item.code (string or array) or item.codes (array)
        const rawCodes = item.code || item.codes || [];
        const codeList = Array.isArray(rawCodes) ? rawCodes : [rawCodes];
        const displayCode = codeList[0]?.toUpperCase() || "UNKNOWN";

        const emote = itemEmotes[displayCode] || "";
        description += `${emote} \`${codeList.join(', ')}\` **${item.name}**: ${item.price} credits\n`;

        buttons.push(
            new ButtonBuilder()
                .setCustomId(`buy_${displayCode}`)
                .setLabel(`${item.name} - ${item.price.toLocaleString()} credits`)
                .setStyle(ButtonStyle.Primary)
        );
    });

    const embed = new EmbedBuilder()
        .setTitle('🛒 Accessing Signal Store...')
        .setColor('#49CA4D')
        .setDescription(description);

    const buttonRow = new ActionRowBuilder().addComponents(buttons);
    message.reply({ embeds: [embed], components: [buttonRow] });
}

module.exports = {
    shop
};
