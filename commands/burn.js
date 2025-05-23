import fs from 'fs';
const { EmbedBuilder } = require('discord.js');

function burn(message, codes) {
    if (codes.length == 0) {
        message.channel.send('Usage: `.burn <card code> <card code> ... <all/dupes/specific number> etc...`');
        return;
    }
    const embed = new EmbedBuilder().setColor('#FF0000').setTitle('Signals deletation in progress...')
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    
    var description = '';
    var process = [];
    for (let i = 0; i < codes.length; i++) {
        const code = codes[i];
        if (code != 'all' && code != 'dupes' && isNaN(Number(code))) {
            var validCard = userData.cards.findIndex(card => card.code === code) !== -1;
            var rarity = "";
            var credits = 0;
            var amount = 0;
            if (validCard) {
                rarity = metadata.find(card => card.code === code).rarity;
                switch (rarity) {
                    case '3G':
                        credits = Math.floor(Math.random() * (90 - 50 + 1)) + 50;// random number between 50 and 90
                        break;
                    case '4G':
                        credits = Math.floor(Math.random() * (190 - 150 + 1)) + 150;// random number between 150 and 190
                        break;
                    case '5G':
                        credits = Math.floor(Math.random() * (290 - 250 + 1)) + 250;// random number between 250 and 290
                        break;
                }
                for (let j = i; j < codes.length; j++) {
                    const element = codes[j];
                    if (element == 'all') {
                        amount = userData.cards.find(card => card.code === code).count;
                        userData.cards = userData.cards.filter(card => card.code !== code);
                        break;
                    } else if (element == 'dupes') {
                        amount = userData.cards.find(card => card.code === code).count - 1;
                        // make the card count for the user 1
                        userData.cards = userData.cards.filter(card => card.code !== code);
                        userData.cards.push({ code: code, count: 1 });
                        break;
                    } else if (!isNaN(Number(element))) {
                        amount = Math.abs(parseInt(element));
                        const senderCardIndex = userData.cards.findIndex(card => card.code === code);
                        if (senderCardIndex !== -1 && userData.cards[senderCardIndex].count < amount) {
                            amount = userData.cards[senderCardIndex].count
                            userData.cards = userData.cards.filter(card => card.code !== code);
                        } else if (senderCardIndex !== -1) {
                            userData.cards[senderCardIndex].count -= amount;
                        }
                        break;
                    }
                }
            }

            var result = {
                code: code,
                valid: validCard,
                rarity: rarity,
                credits: credits,
                amount: amount,
            }
            process.push(result);
        }
    }
    var totalCredits = 0;
    for (let i = 0; i < process.length; i++) {
        const element = process[i];
        if (element.valid) {
            description += `\`${element.amount}\` cop${element.amount>1?"ies":"y"} of \`${element.code}\` for **${element.amount*element.credits}** credits\n`;
            totalCredits += element.amount * element.credits;
        }
    }
    description += "\n";
    for (let i = 0; i < process.length; i++) {
        const element = process[i];
        if (!element.valid) {
            description += `-# error, the following signal was not found in your system. \`${element.code}\`\n`;
        }
    }
    description += `\ntotal of **${totalCredits}** credits have been refunded to your wallet.`;
    userData.wallet += totalCredits;
    embed.setDescription(description);
    message.reply({ embeds: [embed] });
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));
}

module.exports = {
    burn,
};