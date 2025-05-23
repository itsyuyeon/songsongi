const fs = require('fs');
const db = require('../db');

async function buy(intermsg, cardpack, amount = 1) {
    const userId = intermsg?.user?.id || intermsg?.author?.id;
    if (!cardpack || !amount || !userId) {
        intermsg.reply('Usage: `.buy <cardpack> <amount>`');
        return;
    }

    amount = Math.abs(parseInt(amount));
    if (isNaN(amount) || amount === 0 || amount > 10) {
        intermsg.reply(`You cannot buy ${amount} card packs!`);
        return;
    }

    const shopData = JSON.parse(fs.readFileSync('./shop/shop.json', 'utf8'));
    const item = shopData.find(i => i.code.toLowerCase() === cardpack.toLowerCase());

    if (!item) {
        intermsg.reply('Item not found in the shop.');
        return;
    }

    // Load user from PostgreSQL
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
        return intermsg.reply('User not found in the database.');
    }

    const user = result.rows[0];
    const totalCost = item.price * amount;

    if (user.wallet < totalCost) {
        return intermsg.reply(`Not enough credits! You need ${totalCost - user.wallet} more.`);
    }

    // Deduct and update wallet
    await db.query('UPDATE users SET wallet = wallet - $1 WHERE id = $2', [totalCost, userId]);

    // Optionally: Save cardpacks purchase logic if needed
    // You can store it in a "purchased_packs" table or similar

    intermsg.reply(`✅ You bought \`${amount}\` ${item.name} for \`${totalCost}\` credits!`);
}

module.exports = { buy };
