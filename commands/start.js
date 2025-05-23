const { EmbedBuilder } = require('discord.js');
const db = require('../db');

async function start(message) {
    const userId = message.author.id;

    // Check if user exists in database
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length > 0) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("**You are already online in the HyperSync Grid!**")
                    .setDescription("_Your identity has already been synced._")
                    .setFooter({ text: "Kindly check #guide to begin!" })
                    .setColor("#F9768C")
            ]
        });
    }

    // Insert user into database
    await db.query(`
        INSERT INTO users (id, username, wallet, syncbank, cardpacks, cards)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, [
        userId,
        message.author.username,
        2000, // Starting wallet
        0,    // Starting syncbank
        [],   // Empty cardpacks
        []    // Empty cards
    ]);

    message.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle("**You are now online in the HyperSync Grid!**")
                .setDescription("_Your identity has been synced and you're now connected to the network._")
                .setFooter({ text: "Kindly check #guide to begin!" })
                .setColor("#F9768C")
        ]
    });
}

async function hasStarted(userId) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows.length > 0;
}

function notStartedMessage(message) {
    message.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle("**You are still offline in the HyperSync Grid!**")
                .setDescription("_Your identity hasn't been synced and you're not connected to the network yet._")
                .setFooter({ text: "Kindly do .start to sync your account!" })
                .setColor("#F9768C")
        ]
    });
}

module.exports = {
    start,
    hasStarted,
    notStartedMessage
};