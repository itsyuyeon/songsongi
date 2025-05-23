import fs from 'fs';

function sell(message, userId, code, amount) {
    if (!userId || !code || !amount) {
        message.channel.send('Usage: `.sell <@username/User ID> <code> <all/dupes/specific number>`');
        return;
    }

    if (userId.startsWith('<@')) {
        userId = userId.replace(/[<@&>]/g, '');
    } else if (userId.startsWith('@')) {
        userId = userId.replace(/[@]/g, '');
    }
    
    if (!userId.match(/^\d+$/)) {
        message.channel.send('Invalid user ID!');
        return;
    }
    if (userId === message.author.id) {
        message.channel.send('You cannot sell cards to yourself!');
        return;
    }
    // check if userId is a valid user with fs
    if (!fs.existsSync(`./inventory/${userId}.json`)) {
        message.channel.send('User not in database!');
        return;
    }

    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
    var validCard = metadata.findIndex(card => card.code === code) !== -1;
    
    if (!validCard) {
        message.channel.send('Invalid card code!');
        return;
    }

    const senderData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    if (senderData.cards.findIndex(card => card.code === code) === -1) {
        message.channel.send('You do not have this card!');
        return;
    }

    if (amount == "all") {
        amount = senderData.cards.find(card => card.code === code).count;
        senderData.cards = senderData.cards.filter(card => card.code !== code);
    } else if (amount == "dupes") {
        amount = senderData.cards.find(card => card.code === code).count - 1;
        // make the card count for the user 1
        senderData.cards = senderData.cards.filter(card => card.code !== code);
        senderData.cards.push({ code: code, count: 1 });
    } else {
        amount = Math.abs(parseInt(amount));
        if (amount <= 0) {
            message.channel.send(`You cannot sell ${amount} cards!`);
            return;
        }
        const senderCardIndex = senderData.cards.findIndex(card => card.code === code);
        if (senderData.cards[senderCardIndex].count < amount) {
            message.channel.send(`You do not have ${amount} of this card!`);
            return;
        }
        senderData.cards[senderCardIndex].count -= amount;
        if (senderData.cards[senderCardIndex].count === 0) {
            senderData.cards.splice(senderCardIndex, 1);
        }
    }

    // check if receiver has the card on the hoard list and has enough credits
    const receiverData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    const receiverCardIndex = receiverData.cards.findIndex(card => card.code === code);
    if (receiverCardIndex !== -1) {
        receiverData.cards[receiverCardIndex].count += amount;
    } else {
        receiverData.cards.push({ code: code, count: amount });
    }

    var credits = 0;
    if (code.startsWith("3G")) {
        credits = 100;
    } else if (code.startsWith("4G")) {
        credits = 200;
    } else if (code.startsWith("5G")) {
        credits = 400;
    }

    if (Date.now() > receiverData.hoard.reset) {
        receiverData.hoard.reset = Date.now() + 86400000;
        if (receiverData.wallet >= receiverData.hoard.limit) {
            receiverData.hoard.remaining = receiverData.hoard.limit;
            receiverData.wallet -= receiverData.hoard.limit;
        } else {
            receiverData.hoard.remaining = receiverData.wallet;
            receiverData.wallet = 0;
        }
    }

    if (credits*amount > receiverData.hoard.remaining) {
        message.channel.send(`This transation succeeds the hoard limit amount for this user, they only have ${receiverData.hoard.remaining} credits!`);
        return;
    }
    receiverData.hoard.remaining -= credits*amount;
    senderData.wallet += credits*amount;
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(senderData, null, 2));
    message.channel.send(`You have successfully sold ${amount}x ${code} cards to <@${userId}>! You have received ${credits*amount} credits!`);
}

export{
    sell,
};