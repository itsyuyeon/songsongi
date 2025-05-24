import fs from 'fs';

export function staff(message) {
    // check if user has staff role
    if (!message.member.roles.cache.some(role => role.name === "system operator")) {
        message.reply('Only staff can use this command!');
        return;
    }
    const userData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
    userData.wallet += 15000;
    message.channel.send("15000 credits synced to your account.");
    fs.writeFileSync(`./inventory/${message.author.id}.json`, JSON.stringify(userData, null, 2));
}

