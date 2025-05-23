const fs = require('fs');
const path = require('path');
const { AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

// Store active drops and last claim timestamps
const activeDrops = new Map();
const lastClaimTimestamps = new Map();

async function drop(message) {
    const userId = message.author.id;
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8')).filter(c => !c.archived);

    if (metadata.length < 3) return message.reply('Not enough cards available for a drop.');

    const selectedCards = getRandomCards(metadata, 3);
    const imagePath = path.resolve(__dirname, `../cards/${selectedCards[0].code}.png`);
    const attachment = new AttachmentBuilder(imagePath);

    const buttons = new ActionRowBuilder().addComponents(
        selectedCards.map(card =>
            new ButtonBuilder()
                .setCustomId(`pick_${card.code}`)
                .setLabel(card.name)
                .setStyle(ButtonStyle.Secondary)
        )
    );

    async function getCachedOrNewImage(cards, cachePath) {
    if (fs.existsSync(cachePath)) {
        console.log("Using cached image!");
        return new AttachmentBuilder(cachePath);
    }

    // const canvas = createCanvas(6500, 3000);
    const canvas = createCanvas(2300, 1000);
    const ctx = canvas.getContext('2d');

    // Load and draw images side by side
    for (let i = 0; i < cards.length; i++) {
        const img = await loadImage(./cards/${cards[i].code}.png);
        // ctx.drawImage(img, i * 300, 0, 300, 400);
        
        var width = Math.round(img.width*0.50);
        var height = Math.round(img.height*0.50);
        ctx.drawImage(img, (i * 1000) - (266 * i), 0, width, height);
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(cachePath, buffer);
    return new AttachmentBuilder(cachePath);
}

    const embed = new EmbedBuilder()
        .setTitle('Scanning complete')
        .setDescription(`@${message.author.username}, choose your connection!`)
        .setImage(`attachment:/${selectedCards[0].code}.png`)
        .setColor('#52A5FF');

    const reply = await message.reply({ embeds: [embed], files: [attachment], components: [buttons] });

    activeDrops.set(reply.id, {
        userId,
        codes: selectedCards.map(card => card.code),
        timestamp: Date.now(),
        bannedUsers: []
    });

    setTimeout(() => {
        if (activeDrops.has(reply.id)) {
            activeDrops.delete(reply.id);
            reply.edit({ content: 'Drop expired!', components: [] });
        }
    }, 180000);
}

function getRandomCards(metadata, count) {
    const rarityWeights = {
        '3G': 70,
        '4G': 50,
        '5G': 30,
        'PRISM': 10
    };

    const result = [];
    const available = [...metadata];

    for (let i = 0; i < count; i++) {
        let total = 0;
        for (let r in rarityWeights) total += rarityWeights[r];
        let rand = Math.random() * total, sum = 0;

        for (let rarity in rarityWeights) {
            sum += rarityWeights[rarity];
            if (rand <= sum) {
                const filtered = available.filter(c => c.rarity === rarity);
                if (filtered.length > 0) {
                    const pick = filtered[Math.floor(Math.random() * filtered.length)];
                    result.push(pick);
                    available.splice(available.indexOf(pick), 1);
                }
                break;
            }
        }
    }

    return result;
}

async function handleButtonInteraction(interaction) {
    const dropInfo = activeDrops.get(interaction.message.id);
    if (!dropInfo) {
        return interaction.reply({ content: 'This drop has expired!', ephemeral: true });
    }

    const now = Date.now();
    const lastClaim = lastClaimTimestamps.get(interaction.user.id);
    if (lastClaim && now - lastClaim < 300000) {
        const remaining = Math.ceil((300000 - (now - lastClaim)) / 1000);
        return interaction.reply({ content: `You must wait **${remaining} seconds** before claiming another card.`, ephemeral: true });
    }

    if (dropInfo.bannedUsers.includes(interaction.user.id)) {
        return interaction.reply({ content: 'You have already claimed from this drop!', ephemeral: true });
    }

    const timeElapsed = now - dropInfo.timestamp;
    const isOwner = interaction.user.id === dropInfo.userId;
    if (timeElapsed < 30000 && !isOwner) {
        const waitTime = Math.ceil((30000 - timeElapsed) / 1000);
        return interaction.reply({ content: `Wait ${waitTime} seconds before claiming from someone else's drop!`, ephemeral: true });
    }

    function createCardButtons(cards) {
    const rarityEmotes = {
        "3G": "1358000209870717000",
        "4G": "1358000213322629230",
        "5G": "1358000216078417920",
        "PRISM": "1365197464961024041"
    };

    return cards.map(card => {
        const emojiId = rarityEmotes[card.rarity];

        return new ButtonBuilder()
            .setCustomId(pick_${card.code})
            .setLabel(${card.code} ${card.name})
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emojiId ? { id: emojiId } : undefined);
    });
}

    const code = interaction.customId.split('_')[1];
    const cardMeta = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8')).find(c => c.code === code);

    const messageMap = {
        '3G': `<@${interaction.user.id}> detected a **weak signal** — \`${code}\` locked!`,
        '4G': `<@${interaction.user.id}> established a **stable connection**. Signal received: \`${code}\``,
        '5G': `<@${interaction.user.id}> achieved a **high-speed sync**! Card unlocked: \`${code}\``,
        'PRISM': `<@${interaction.user.id}> unlocked a **Dear Diary** entry: \`${code}\`!`
    };

    interaction.reply({ content: messageMap[cardMeta.rarity] || `🎴 <@${interaction.user.id}> claimed: \`${code}\``, ephemeral: false });

    const inventoryPath = `./inventory/${interaction.user.id}.json`;
    const userData = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    const card = userData.cards.find(c => c.code === code);
    if (card) card.count++;
    else userData.cards.push({ code, count: 1 });

    userData.cooldown = userData.cooldown || {};
    userData.cooldown.claim = Date.now() + 5 * 60 * 1000;
    fs.writeFileSync(inventoryPath, JSON.stringify(userData, null, 2));

    lastClaimTimestamps.set(interaction.user.id, Date.now());
    dropInfo.bannedUsers.push(interaction.user.id);
}

async function paidDrop(message) {
    const userId = message.author.id;
    const userDataPath = `./inventory/${userId}.json`;

    const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));

    if (userData.wallet < 250) {
        return message.reply('You do not have enough credits to drop a card.');
    }

    userData.wallet -= 250;
    userData.paidDropCount = (userData.paidDropCount || 0) + 1;

    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8')).filter(c => !c.archived);

    let prismRate = 10;
    if (userData.paidDropCount >= 15) prismRate = 30;
    if (userData.paidDropCount >= 20) prismRate = 100;

    const rarityWeights = {
        '5G': 30,
        '4G': 50,
        '3G': 70,
        'PRISM': prismRate
    };

    const selectedCard = getRandomCardWithWeights(metadata, rarityWeights);
    const index = userData.cards.findIndex(card => card.code === selectedCard.code);
    if (index !== -1) userData.cards[index].count++;
    else userData.cards.push({ code: selectedCard.code, count: 1 });

    if (selectedCard.rarity === "PRISM") {
        userData.paidDropCount = 0;
    }

    fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));

    const colorMap = {
        "3G": "#81b8ff",
        "4G": "#ffb381",
        "5G": "#b981ff",
        "PRISM": "#c6deff"
    };
    const colour = colorMap[selectedCard.rarity] || "#b981ff";

    const imagePath = path.resolve(__dirname, `../cards/${selectedCard.code}.png`);
    const imageAttachment = new AttachmentBuilder(imagePath);

    const embed = new EmbedBuilder()
        .setColor(colour)
        .setTitle('Paid Card Dropped!')
        .setImage(`attachment://${selectedCard.code}.png`)
        .setDescription(`**Transaction confirmed!** 
            
        You spent \`250 credits\` <:credits:1357992150457126992> and received Signal Data: \`${selectedCard.code}\`. 
        **Remaining Balance:** \`${userData.wallet.toLocaleString()}\` credits`);

    message.reply({
        embeds: [embed],
        files: [imageAttachment]
    });
}

function getRandomCardWithWeights(metadata, weights) {
    let totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
    let rand = Math.random() * totalWeight;
    let cumulative = 0;

    for (let rarity in weights) {
        cumulative += weights[rarity];
        if (rand <= cumulative) {
            const candidates = metadata.filter(card => card.rarity === rarity);
            if (candidates.length > 0) {
                return candidates[Math.floor(Math.random() * candidates.length)];
            }
        }
    }

    return metadata[Math.floor(Math.random() * metadata.length)];
}

module.exports = {
    drop,
    handleButtonInteraction,
    paidDrop
};
