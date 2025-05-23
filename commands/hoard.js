import fs from 'fs';
const { EmbedBuilder } = require('discord.js');

function hoardList(message) {
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const list = userData.hoard.list;
    // split the list into 3 arrays for 3G, 4G, 5G rarity
    const rarity3G = list.filter(card => card.startsWith("3G"));
    const rarity4G = list.filter(card => card.startsWith("4G"));
    const rarity5G = list.filter(card => card.startsWith("5G"));

    var description = "**__Data Core__ :**\n";
    if (rarity3G.length > 0) {
        description += "**3G:**";
        rarity3G.forEach(card => {
            description += ` \`${card}\``;
        });
        description += "\n";
    }
    if (rarity4G.length > 0) {
        description += "**4G:**";
        rarity4G.forEach(card => {
            description += ` \`${card}\``;
        });
        description += "\n";
    }
    if (rarity5G.length > 0) {
        description += "**5G:**";
        rarity5G.forEach(card => {
            description += ` \`${card}\``;
        });
        description += "\n";
    }
    description += "**__Data Limit__ :**\n";
    description += `**Hoard Limit:** ${userData.hoard.limit}\n`;
    description += `**Remaining Hoard:** ${userData.hoard.remaining}\n`;

    const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s Data Core.`)
        .setColor("Blue")
        .setDescription(description)

    message.channel.send({ embeds: [embed]});
}

function hoardSet(message, credits) {
    if (!credits) {
        message.channel.send("Usage: `.hset <limit>`");
        return;
    }
    credits = Math.abs(parseInt(credits));
    if (credits > 0) {
        const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
        userData.hoard.limit = credits;
        userData.hoard.remaining = credits;
        userData.wallet -= credits;
        userData.hoard.reset = Date.now() + 86400000; // 24 hours from now
        fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));
        message.channel.send(`Hoard limit set to ${credits} credits.`);
    } else {
        message.channel.send("Invalid hoard limit!");
    }
}

function hoardAdd(message, code) {
    if (!code) {
        message.channel.send("Usage: `.ha <code>`");
        return;
    }
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
    // check if the card exists in the metadata
    const cardIndex = metadata.findIndex(card => card.code === code);
    if (cardIndex === -1) {
        message.channel.send("Invalid card code!");
        return;
    }

    // check if the user already has the card in their hoard
    const hoardIndex = userData.hoard.list.findIndex(card => card === code);
    if (hoardIndex !== -1) {
        message.channel.send("You already have this card in your hoard!");
        return;
    }
    userData.hoard.list.push(code);
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));
    message.channel.send(`Added ${code} to your hoard!`);
}

function hoardRemove(message, code) {
    if (!code) {
        message.channel.send("Usage: `.hr <code>`");
        return;
    }
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const cardIndex = userData.hoard.list.findIndex(card => card === code);
    if (cardIndex === -1) {
        message.channel.send("You do not have this card in your hoard!");
        return;
    }
    userData.hoard.list.splice(cardIndex, 1);
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));
    message.channel.send(`Removed ${code} from your hoard!`);
}

export{
    hoardList,
    hoardSet,
    hoardAdd,
    hoardRemove,
};