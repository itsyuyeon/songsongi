const fs = require('fs');
const path = require('path');
const { AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const lastClaimTimestamps = new Map();

const activeDrops = new Map(); // stores drop info: {userId, timestamp}

async function drop(message) {
    const NUM_CARDS = 3;
    const DROP_TIMEOUT = 180000; // 3 minutes

    // Load metadata
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));

    // Send loading message
    const loadingMsg = await message.reply('Currently checking our database...');

    // Get random cards from metadata
    if (metadata.length < NUM_CARDS) {
        return message.reply('Not enough cards available for a drop.');
    }

    const selectedCards = getRandomCards(metadata, NUM_CARDS);
    selectedCards.sort(sortByRarity);

    const cardCodes = selectedCards.map(card => card.code);
    const cacheFileName = generateCacheFileName(cardCodes);
    const fullCachePath = `./temp/${cacheFileName}`;

    try {
        const attachment = await getCachedOrNewImage(selectedCards, fullCachePath);
        const buttons = new ActionRowBuilder().addComponents(createCardButtons(selectedCards));

        const sentMessage = await loadingMsg.edit({
            content: `**Scanning complete**, @${message.author.username}. Choose your connection!`,
            files: [attachment],
            components: [buttons]
        });

        // Store drop info and set expiration
        activeDrops.set(sentMessage.id, {
            userId: message.author.id,
            timestamp: Date.now(),
            bannedUsers: []
        });

        setTimeout(() => {
            activeDrops.delete(sentMessage.id);
            sentMessage.edit({
                content: '**Drop expired!** No more cards can be claimed.',
                components: []
            }).catch(() => {});
        }, DROP_TIMEOUT);

    } catch (error) {
        console.error('Drop error:', error);
        loadingMsg.edit('There was an error processing the cards.');
    }
}

// private helper functions
function getRandomCards(metadata, count) {
    /*
    3G cards - Lowest Rarity, Droprate 70%
    4G cards - Mid Rarity, Droprate 50%
    5G cards - Highest Rarity, Droprate 30%
    PRISM (Event) cards - When droppable, Droprate 10%
    */
   metadata = metadata.filter(card => !card.archived);// fillter cards that have been archived

    const randomCards = [];
    const rarityWeights = {
        // 'LTE': 10,
        '5G': 30,
        '4G': 50,
        '3G': 70,
        'PRISM': 10,
    };
    var max = 0;for (const weight in rarityWeights) {max += rarityWeights[weight];};
    for (let i = 0; i < count; i++) {
        var randomNum = (Math.random() * max)+1;
        var counter = 0;
        for (const rarity in rarityWeights) {
            counter += rarityWeights[rarity];
            if (randomNum <= counter) {
                var cards = metadata.filter(card => card.rarity === rarity).slice(0, count);
                if (cards.length != 0) {
                    var randomIndex = Math.floor(Math.random() * cards.length);
                    randomCards.push(cards[randomIndex]);
                    metadata.splice(metadata.indexOf(cards[randomIndex]), 1);
                    console.log("Card selected using rarity:", cards[randomIndex]?.code);
                    break;
                }
            }
        }
    }
    
    if (randomCards.length < count) {
        metadata.sort(sortByRarity);
        var remainingCards = metadata.filter(card => !randomCards.includes(card));
        var test = count-randomCards.length;
        for (let i = 0; i < test; i++) {
            var randomIndex = Math.floor(Math.random() * remainingCards.length);
            randomCards.push(remainingCards[randomIndex]);
            remainingCards.splice(randomIndex, 1);
        }
    }
    return randomCards;
}

function sortByRarity(a, b) {
    return b.rarity - a.rarity;
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
            .setCustomId(`pick_${card.code}`)
            .setLabel(`${card.code} ${card.name}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(emojiId ? { id: emojiId } : undefined);
    });
}


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
        const img = await loadImage(`./cards/${cards[i].code}.png`);
        // ctx.drawImage(img, i * 300, 0, 300, 400);
        
        var width = Math.round(img.width*0.50);
        var height = Math.round(img.height*0.50);
        ctx.drawImage(img, (i * 1000) - (266 * i), 0, width, height);
    }

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(cachePath, buffer);
    return new AttachmentBuilder(cachePath);

}

function generateCacheFileName(cardCodes) {
    return `drop_${cardCodes.join('_')}.png`;   
}

async function handleButtonInteraction(interaction) {
    var dropInfo = activeDrops.get(interaction.message.id);
    if (!dropInfo) {// this error ocurs a lot
        interaction.reply({ content: 'This drop has expired!', ephemeral: true });
        return;
    }

       const lastClaim = lastClaimTimestamps.get(interaction.user.id);
    if (lastClaim && Date.now() - lastClaim < 5 * 60 * 1000) { // 5 minutes
    const remaining = Math.ceil((5 * 60 * 1000 - (Date.now() - lastClaim)) / 1000);
    await interaction.reply({
        content: `You must wait **${remaining} seconds** before claiming another card.`,
        ephemeral: true
    });
    return;
    }   

    if (dropInfo.bannedUsers.includes(interaction.user.id)) {
        interaction.reply({ content: 'You have already claimed this drop!', ephemeral: true });
        return;
    }

    const timeElapsed = Date.now() - dropInfo.timestamp;
    const isOriginalUser = interaction.user.id === dropInfo.userId;

if (timeElapsed < 30000 && !isOriginalUser) {
    let timeLeft = Math.ceil((30000 - timeElapsed) / 1000); // remaining time in seconds

    const reply = await interaction.reply({
        content: `You must wait ${timeLeft} second${timeLeft !== 1 ? 's' : ''} before claiming someone else's drop!`,
        ephemeral: true,
        fetchReply: true
    });

    const interval = setInterval(async () => {
        timeLeft--;

        if (timeLeft <= 0) {
            clearInterval(interval);
            // Optionally delete the ephemeral message after countdown finishes
            try {
                await interaction.editReply({
                    content: `You can now claim the drop!`
                });
            } catch (e) {
                console.error('Failed to edit reply:', e);
            }
            return;
        }

        try {
            await interaction.editReply({
                content: `You must wait ${timeLeft} second${timeLeft !== 1 ? 's' : ''} before claiming someone else's drop!`
            });
        } catch (e) {
            clearInterval(interval); // stop trying if it errors (e.g., interaction no longer valid)
        }
    }, 1000);

    return;
}


    const code = interaction.customId.split('_')[1];
    
    // Get the original buttons and modify them
    const originalButtons = interaction.message.components[0].components;
    const disabledButtons = new ActionRowBuilder().addComponents(
        originalButtons.map(button => {
            if (button.customId === interaction.customId) {
                return ButtonBuilder.from(button).setDisabled(true).setStyle(ButtonStyle.Secondary);
                // .setLabel(`~~${button.label}~~`);
            } else {
                return button;
            }
        })
    );

    // Update message with disabled buttons
    await interaction.message.edit({
        components: [disabledButtons]
    });

    // Process the claim
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    const card = metadata.find(card => card.code === code);
    var message = "";
    switch (card.rarity) {
        case "3G":
            message = `<@${interaction.user.id}> has detected a **weak signal** — \`${card.code}\` locked`;
            break;
        case "4G":
            message = `<@${interaction.user.id}> has established a **stable connection**. 4G signal received: \`${card.code}\``;
            break;
        case "5G":
            message = `<@${interaction.user.id}> has achieved a **high-speed sync**! You pulled: \`${card.code}\``;
            break;
        case "PRISM":
            message = `<@${interaction.user.id}> has achieved a **DIARY**! You pulled: \`${card.code}\``;
            break;
        default:
            message = `<@${interaction.user.id}> has detected a **weak signal** — \`${card.code}\` locked`;
            break;
    }
    interaction.reply({ content: message, ephemeral: false });
    var userData = JSON.parse(fs.readFileSync(`./inventory/${interaction.user.id}.json`, 'utf8'));
    var c = userData.cards.find(card => card.code === code)
    if (c === undefined) {
        userData.cards.push({ code: code, count: 1 });
    } else {
        c.count++;
    }
    fs.writeFileSync(`./inventory/${interaction.user.id}.json`, JSON.stringify(userData, null, 2));
    lastClaimTimestamps.set(interaction.user.id, Date.now()); // 🔐 Set the cooldown
    // prevent the user from claiming the drop again
    dropInfo.bannedUsers.push(interaction.user.id);
    activeDrops.set(interaction.user.id, dropInfo);

    const inventory = JSON.parse(fs.readFileSync(`./inventory/${interaction.user.id}.json`, 'utf8'));
    if (!userData.cooldown) userData.cooldown = {};
    userData.cooldown.claim = Date.now() + 5 * 60 * 1000;

    inventory.cooldown.claim = Date.now() + 5 * 60 * 1000; // 5 mins
    fs.writeFileSync(`./inventory/${interaction.user.id}.json`, JSON.stringify(inventory, null, 2));

}

async function paidDrop(message) {
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const wallet = userData.wallet;
    if (wallet < 250) {
        return message.reply('You do not have enough credits to drop a card.');
    } else {
        userData.wallet -= 250;
    }
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    const selectedCards = getRandomCards(metadata, 1)[0];
    const index = userData.cards.findIndex(card => card.code === selectedCards.code);
    if (index !== -1) {
        userData.cards[index].count++;
    } else {
        userData.cards.push({ code: selectedCards.code, count: 1 });
    }
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));

    var colour = "#b981ff";
    if (selectedCards.rarity === "3G") {
        colour = "#81b8ff";
    } else if (selectedCards.rarity === "4G") {
        colour = "#ffb381";
    } else if (selectedCards.rarity === "5G") {
        colour = "#b981ff";
    } else if (selectedCards.rarity === "PRISM") {
        colour = "#c6deff";
    }

    const imagePath = path.resolve(__dirname, `../cards/${selectedCards.code}.png`);
    const imageAttachment = new AttachmentBuilder(imagePath);

    const embed = new EmbedBuilder()
        .setColor(colour)
        .setTitle('Paid Card Dropped!')
        .setImage(`attachment://${selectedCards.code}.png`)
        .setDescription(`**Transaction confirmed!** You just spent 250 credits and received Signal Data : ${selectedCards.code}\n-# Your remaining balance : ${userData.wallet} credits`)

    message.reply({
    embeds: [embed],
    files: [imageAttachment] // <== Add this
});
}


module.exports = {
    drop,
    handleButtonInteraction,
    paidDrop,
};