const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

function open(message, code) {
    if (!code) {
        message.reply('Usage: `.open <code>`');
        return;
    }

    const userId = message.author.id;
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));

    const packIndex = userData.cardpacks.findIndex(pack => pack.code === code);
    if (packIndex === -1) {
        message.reply('You do not have this card pack!');
        return;
    }

    const pack = userData.cardpacks[packIndex];
    // remove the pack from the inventory
    userData.cardpacks.splice(packIndex, 1);
    
    // generate cards based on the rarity
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    const cards = getRandomCards(metadata, pack.cards, pack.rarity);
    // add the cards to the inventory
    cards.forEach(card => {
        if (card !== undefined) {
            const pack = packs.find(p =>
             Array.isArray(p.codes) &&
             p.codes.some(code => code.toLowerCase() === inputCode.toLowerCase())
            );
            if (cardIndex === -1) {
                userData.cards.push({code: card?.code, count: 1});
            } else {
                userData.cards[cardIndex].count++;
            }
        }
    });

    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(userData, null, 2));
    var description = "";
    cards.forEach(card => {
        if (card !== undefined) {
            description += `${card?.code} ${card?.name}\n`;
        }
    });
    const embed = new EmbedBuilder()
    .setTitle('Pack deployed! Signal cards loading...')
    .setDescription(description)
    .setColor('#96B5E3');
    

    message.reply({ embeds: [embed] });
}

function getRandomCards(metadata, count, rarity) {
   metadata = metadata.filter(card => !card.archived);// fillter cards that have been archived

    const randomCards = [];
    const rarityWeights = rarity;
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

module.exports = {
    open,
};