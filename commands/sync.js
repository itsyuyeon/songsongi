import fs from 'fs';
const { EmbedBuilder } = require('discord.js');
const {isCooldown, setCooldown} = require('./cooldown.js');

function sync(message) {
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const embed = new EmbedBuilder();

    if (isCooldown(message.author.id, 'sync')) {
        const syncTime = userData.cooldown.sync - Date.now();
        const syncMin = Math.floor(syncTime / 60000);
        const syncSec = Math.floor((syncTime % 60000) / 1000);
        embed.setTitle("You're still connected to the last task.")
        embed.setDescription(
`Retry in \`${syncMin}\`m \`${syncSec}\`s

-# You've sync-ed ${userData.streak.sync} times! 
-# Your current balance is ${userData.wallet} credits`
        )
    } else {
        const credits = Math.floor(Math.random() * (200 - 50 + 1)) + 50;
        userData.wallet += credits;
        // reset streak if the user has not synced in 24 hours
        if (userData.cooldown.sync - Date.now() > 86400000) {
            userData.streak.sync = 0;
        }
        embed.setTitle("Sync initiated.")
        embed.setDescription(
`**Network task completed!**
${credits} credits have been added to your wallet.

-# You've sync-ed ${++userData.streak.sync} times!
-# Your current balance is ${userData.wallet} credits`
        )
        userData.cooldown.sync = setCooldown(message.author.id, 'sync', 60);
        fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));
    }
    message.reply({ embeds: [embed] });
}

export{
    sync,
};