const fs = require('fs');

function buy(intermsg, cardpack, amount) {
    if (!cardpack || !amount) {
        intermsg.reply('Usage `.buy <cardpack> <amount>`');
        return;
    }

    // check if the cardId is valid by looking for the card in the cards folder
    const shopData = JSON.parse(fs.readFileSync('./shop/shop.json', 'utf8'));
    const item = shopData.find(item => item.code === cardpack);

    var userId;
    if (intermsg?.author?.id) {
        userId = intermsg.author.id;
    } else if (intermsg?.user?.id) {
        userId = intermsg.user.id;
    }

    if (!item) {
        intermsg.reply('Item not found!');
        return;
    }

    amount = Math.abs(parseInt(amount));
    if (amount == 0 || amount > 10) {
        intermsg.reply(`You cannot buy ${amount} card packs!`);
        return;
    }

    const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));

    if (userData.wallet >= item.price*amount) {
        userData.wallet -= item.price*amount;
        for (let i = 0; i < amount; i++) {
            userData.cardpacks.push(item);
        }
        fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(userData, null, 2));
        intermsg.reply(`You bought ${amount} ${item.name} for ${item.price*amount} credits!`);
    } else {
        intermsg.reply(`You do not have enough credits! Need ${(item.price*amount)-userData.wallet} more.`);
    }
}


module.exports = {
    buy,
};