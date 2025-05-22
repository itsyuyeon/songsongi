const fs = require('fs');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

function shop(message) {
    // display the shop using embeds and "./shop/shop.json" file
    const shopData = JSON.parse(fs.readFileSync('./shop/shop.json', 'utf8'));
    var description = "";

    shopData.forEach(item => {
        // embed.addFields({ name: '', value: `**${item.name}**: ${item.price} \`${item.code}\``, inline: false });
        const itemEmotes = {
        "BYTE": "<:bytepack:1358092889904906400>",
        "CORE": "<:corepack:1358092894224908298>",
        "HYPER": "<:hyperpack:1358092898863808604>"
        };

        const emote = itemEmotes[item.code.toUpperCase()] || "";
        description += `${emote} \`${item.code}\` **${item.name}**: ${item.price} <:credits:13579921504571269928>\n`;

    });

    const embed = new EmbedBuilder()
        .setTitle('🛒 Accessing Signal Store...')
        .setColor('#49CA4D')
        .setDescription(description);

    const buttons = new ActionRowBuilder().addComponents(
        shopData.map(item => {
            return new ButtonBuilder()
                .setCustomId(`buy_${item.code}`)
                .setLabel(`${item.name} - ${item.price} credits`)
                .setStyle(ButtonStyle.Primary);
        })
    );
    message.reply({
        embeds: [embed],
        components: [buttons]
    });
}

function addShop(message, name, description, price, code, amount, rarities) {
    // .ashop "<name>"" "<description>" <price> <code> <amount of cards> <rarities, example: 3G:70 4G:50 5G:30 etc...>
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.channel.send('Only Head Admins can use this command!');
        return;
    }
    if (!name || !description || !price || !code || !amount || !rarities) {
        message.channel.send("Usage: `.ashop <name> \"<description>\" <price> <code> <amount of cards> <rarities, example: 3G:70 4G:50 5G:30 etc...>`")
    }
    const shopData = JSON.parse(fs.readFileSync('./shop/shop.json', 'utf8'));
    const newItem = {
        name: name,
        description: description,
        price: parseInt(price),
        code: code,
        cards: parseInt(amount),
        rarity: rarities.split(' ').reduce((acc, curr) => {
            const [rarity, chance] = curr.split(':');
            acc[rarity] = parseInt(chance);
            return acc;
        }, {})
    };
    shopData.push(newItem);
    fs.writeFileSync('./shop/shop.json', JSON.stringify(shopData, null, 2));
    message.channel.send(`Added ${name} to the shop!`);
}

function removeShop(message, code) {
    // .rshop <code>
    if (!message.member.roles.cache.some(role => role.name === "head admins")) {
        message.channel.send('Only Head Admins can use this command!');
        return;
    }
    if (!code) {
        message.channel.send("Usage: `.rshop <code>`");
        return;
    }
    const shopData = JSON.parse(fs.readFileSync('./shop/shop.json', 'utf8'));
    const index = shopData.findIndex(item => item.code === code);
    if (index === -1) {
        message.channel.send('Item not found in shop!');
        return;
    }
    shopData.splice(index, 1);
    fs.writeFileSync('./shop/shop.json', JSON.stringify(shopData, null, 2));
    message.channel.send(`Removed item with code ${code} from the shop!`);
}

module.exports = {
    shop,
    addShop,
    removeShop
};