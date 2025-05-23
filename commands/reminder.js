import fs from 'fs';
const { EmbedBuilder } = require('discord.js');

async function reminder(message, onoff, type) {
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    

    if (onoff === "on") {
        userData.reminder.on = true;

        if (type === "ping") {
            userData.reminder.type = "ping";
        } else if (type === "dm") {
            userData.reminder.type = "dm";
        }

    } else if (onoff === "off") {
        userData.reminder.on = false;
    } else {
        message.reply("Please specify whether you want the reminder on or off.");
        return;
    }

    // make embed
    const embed = new EmbedBuilder()
        .setTitle("Reminder Settings")
        .setDescription(`Reminder is now **${userData.reminder.on ? "on" : "off"}**`)
        .addFields(
            { name: "Type", value: userData.reminder.type, inline: true }
        )
        .setColor("#FFEE52");

    message.reply({ embeds: [embed] });

    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));
}

async function setReminder(id, type, time) {
    const userData = JSON.parse(fs.readFileSync(`./inventory/${id}.json`, 'utf8'));
    userData.reminder[type] = Date.now() + time*60000;
    fs.writeFileSync(`./inventory/${id}.json`, JSON.stringify(userData, null, 2));
}

async function reminderLoop(client) {
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 60000));// wait for 1 minute
        console.log("Checking for reminders...");
        const inventories = fs.readdirSync('./inventory');
        for (const inventory of inventories) {
            const userData = JSON.parse(fs.readFileSync(`./inventory/${inventory}`, 'utf8'));
            if (userData.reminder.on) {
                const now = Date.now();
                for (const type in userData.reminder) {
                    if (type !== "on" && type !== "type" && userData.reminder[type] < now && userData.reminder[type] !== null) {
                        // send reminder
                        const embed = new EmbedBuilder()
                            .setTitle("Reminder")
                            .setDescription(`Your reminder to do the **${type}** command!`)
                            .setColor("#FFEE52");
                        // dm the user
                        const user = await client.users.fetch(inventory.split(".")[0]);
                        if (userData.reminder.type === "ping") {
                        } else if (userData.reminder.type === "dm") {
                            user.send({ embeds: [embed] });
                        }
                        userData.reminder[type] = null;
                    }
                }
                fs.writeFileSync(`./inventory/${inventory}`, JSON.stringify(userData, null, 2));
            }
        }
    }
}

module.exports = {
    reminder,
    setReminder,
    reminderLoop
};
