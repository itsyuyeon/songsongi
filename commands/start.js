const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const pool = require('../db');

function start(message) {
    if (hasStarted(message.author.id)) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("**You are already online in the HyperSync Grid!**")
                    .setDescription("_Your identity has already been synced._")
                    .setFooter({ text: "Kindly check #guide to begin!" })
                    .setColor("#F9768C")
            ]
        });
    } else {
        // Create the inventory file if it doesn't exist
        fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify({
            id: message.author.id,
            cards: [],
            syncbank: 0,
            wallet: 2000,
            cardpacks: [],
            profile: {
                username: message.author.username,
                dateJoined: new Date().toLocaleDateString(),
                bio: "",
                faviorite: "",
                border1: "#FF00FF",
                border2: "#02DEFB",
                background1: "#0F0025",
                background2: "#0F0025",
                text: "#FFFFFF"
            },
            cooldown: {
              drop: 0,
              sync: 0,
              login: 0,
              checkin: 0,
              boost: 0,
              boosterDrop: 0,
              staff: 0,
            },
            reminder: {
                on: false,
                type: "dm",
                drop: 0,
                sync: 0,
                login: 0,
                checkin: 0,
                boost: 0,
                boosterDrop: 0,
                staff: 0,
            },
            streak: {
                login: 0,
                sync: 0,
            },
            hoard: {
                list: [],
                limit: 0,
                remaining: 0,
                reset: 0,
            }
        }, null, 2));

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
}

function hasStarted(userId) {
    return fs.existsSync(`./inventory/${userId}.json`);
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
    notStartedMessage,
};