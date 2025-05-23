import fs from 'fs';

function gift(message, args) {
    if (args.length < 3 || args.length % 2 === 0) {
        message.channel.send('Usage: `.gift <@user/UserID> <code> <amount> [<code> <amount>]...`');
        return;
    }

    let userId = args[0];
    if (userId.startsWith('<@')) userId = userId.replace(/[<@!>]/g, '');
    if (!userId.match(/^\d+$/)) return message.channel.send('Invalid user ID!');
    if (userId === message.author.id) return message.channel.send('You cannot gift cards to yourself!');
    if (!fs.existsSync(`./inventory/${userId}.json`)) return message.channel.send('User not in database!');

    const senderData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const receiverData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));

    let summary = [];

    for (let i = 1; i < args.length; i += 2) {
        const inputCode = args[i].toLowerCase();
        const matchedCard = metadata.find(card => card.code.toLowerCase() === inputCode);
        if (!matchedCard) {
        message.channel.send(`Invalid card code: ${args[i]}`);
        continue;
        }
        const code = matchedCard.code; // Preserve original casing  

        if (!isValidCard) {
            message.channel.send(`Invalid card code: ${code}`);
            continue;
        }

        const senderCard = senderData.cards.find(card => card.code === code);
        if (!senderCard) {
            message.channel.send(`You do not have card: ${code}`);
            continue;
        }

        let giveAmount = 0;

        if (amount === "all") {
            giveAmount = senderCard.count;
            senderData.cards = senderData.cards.filter(card => card.code !== code);
        } else if (amount === "dupes") {
            if (senderCard.count <= 1) {
                message.channel.send(`You don't have duplicates of ${code} to gift.`);
                continue;
            }
            giveAmount = senderCard.count - 1;
            senderCard.count = 1;
        } else {
            amount = Math.abs(parseInt(amount));
            if (!amount || amount <= 0 || senderCard.count < amount) {
                message.channel.send(`Invalid amount or not enough cards for: ${code}`);
                continue;
            }
            senderCard.count -= amount;
            giveAmount = amount;
        }

        // Update receiver inventory
        const receiverCard = receiverData.cards.find(card => card.code === code);
        if (receiverCard) {
            receiverCard.count += giveAmount;
        } else {
            receiverData.cards.push({ code: code, count: giveAmount });
        }

        summary.push(`${giveAmount}× ${code}`);
    }

    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(senderData, null, 2));
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));

    if (summary.length > 0) {
        message.channel.send(`${message.author.username} gifted:\n${summary.map(s => `• ${s}`).join('\n')} to <@${userId}>!`);
    } else {
        message.channel.send(`No valid cards were gifted.`);
    }
}

module.exports = {
    gift,
};
