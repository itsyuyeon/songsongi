const fs = require('fs');
const { EmbedBuilder } = require('discord.js');

function cooldown(message) {
    const userId = message.author.id;
    const username = message.author.username;
    const inventory = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));

    const dropTime = inventory.cooldown.drop - Date.now();
    const dropText = dropTime > 0
    ? `${Math.floor(dropTime / 60000)}m ${Math.floor((dropTime % 60000) / 1000)}s`
    : "Ready";
    const clamTime = inventory.cooldown.claim - Date.now();
    const clamText = clamTime > 0
    ? `${Math.floor(clamTime / 30000)}m ${Math.floor((clamTime % 30000) / 1000)}s`
    : "Ready";
    const syncTime = inventory.cooldown.claim - Date.now();
    const syncTime = syncTime > 0
    ? `${Math.floor(dropTime / 60000)}m ${Math.floor((dropTime % 60000) / 1000)}s`
    : "Ready";
    const loginTime = inventory.cooldown.login - Date.now();
    const loginText = loginTime > 0
    ? `${Math.floor(loginTime / 3600000)}h ${Math.floor((loginTime % 3600000) / 60000)}m`
    : "Ready";
    // const loginSec = loginTime % 60;
    
    const embed = new EmbedBuilder()
        .setTitle(`${username}'s cooldowns`)
        .setColor("#F37B4E")
        .addFields(
            { name: "", value: `**Drop:** ${dropText}`, inline: false },
            { name: "", value: `**Claim:** ${clamText}`, inline: false },
            { name: "", value: `**Sync:** ${syncMin}m ${syncSec}s`, inline: false },
            { name: "", value: `**Login:** ${loginHrs}h ${loginMin}m`, inline: false },
        )
    // check if user is a server booster
    if (message.member && message.member.premiumSince) {
        const checkinTime = inventory.cooldown.checkin-Date.now()>0?Math.floor((inventory.cooldown.checkin - Date.now()) / 1000):0;
        const checkinMin = Math.floor(checkinTime / 60);
        const checkinHrs = Math.floor(checkinTime / 3600);
        const boostTime = inventory.cooldown.boost-Date.now()>0?Math.floor((inventory.cooldown.boost - Date.now()) / 1000):0;
        const boostMin = Math.floor(boostTime / 60);
        const boostHrs = Math.floor(boostTime / 3600);
        const boosterDropTime = inventory.cooldown.boosterDrop-Date.now()>0?Math.floor((inventory.cooldown.boosterDrop - Date.now()) / 1000):0;
        const boosterDropMin = Math.floor(boosterDropTime / 60);
        const boosterDropSec = boosterDropTime % 60;
        const boosterClaimTime = inventory.cooldown.boosterClaim-Date.now()>0?Math.floor((inventory.cooldown.boosterClaim - Date.now()) / 1000):0;
        const boosterClaimMin = Math.floor(boosterClaimTime / 60);
        const boosterClaimSec = boosterClaimTime % 60;
        embed.addFields({ name: "", value: `**Boost:** ${boostHrs}h ${boostMin}m`, inline: false });
        embed.addFields({ name: "", value: `**Checkin:** ${checkinHrs}h ${checkinMin}m`, inline: false });
        embed.addFields({ name: "", value: `**Booster Drop:** ${boosterDropMin}m ${boosterDropSec}s`, inline: false });
        embed.addFields({ name: "", value: `**Booster Claim:** ${boosterClaimMin}m ${boosterClaimSec}s`, inline: false });
    }
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(inventory, null, 2));
    message.channel.send({ embeds: [embed] });
}

function isCooldown(userId, command) {
    const inventory = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    return inventory.cooldown[command] > Date.now();
}

function cooldownMessage(message, command) {
    const inventory = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    const timeLeft = Math.floor((inventory.cooldown[command] - Date.now()) / 1000);
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    message.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle(`**You are on cooldown for ${command}**`)
                .setDescription(`You have to wait ${minutes}m ${seconds}s before using this command again.`)
                .setColor("#F9768C")
        ]
    });
}

function setCooldown(userId, command, time) {
    const inventory = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    inventory.cooldown[command] = Date.now() + time*60000;
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(inventory, null, 2));
    return inventory.cooldown[command];
}

module.exports = {
    cooldown,
    isCooldown,
    cooldownMessage,
    setCooldown
};