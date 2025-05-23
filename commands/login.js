import fs from 'fs';
const  { EmbedBuilder } = require('discord.js');
const {isCooldown, setCooldown} = require('./cooldown.js');

function randomCard(rarity) {
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
    var cards;
    if (rarity == "signal") {
        cards = metadata.filter(card => card.rarity === "3G" || card.rarity === "4G" || card.rarity === "5G");
    } else {
        cards = metadata.filter(card => card.rarity === rarity);
    }
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex].code;
}


async function login(message) {
    const userId = message.author.id;
    const userData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    const embed = new EmbedBuilder().setColor('#FFEE52')

    if (isCooldown(userId, 'login')) {
        const timeLeft = Math.floor((userData.cooldown.login - Date.now()) / 1000);
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        embed.setTitle("You're already logged in.");
        embed.setDescription(
`Next login available in \`${hours}h ${minutes}m\`

-# You have logged in for **${userData.streak.login}** days.
-# You currently have ${userData.wallet} credits in your wallet.`
        );
    } else {
        const credits = Math.floor(Math.random() * (350 - 150 + 1)) + 150;// random amount of credits between 150 and 350
        var loginCreditBonus = 0;
        var loginCardBonus = "";
        // check if user is a server booster
        var isBooster = (message.member && message.member.premiumSince);
        
        if (userData.streak.login == 10) {
            loginCreditBonus = 50;
            loginCardBonus = randomCard("3G");
        } else if (userData.streak.login == 20) {
            loginCreditBonus = 70;
            loginCardBonus = randomCard("4G");
        } else if (userData.streak.login == 30) {
            loginCreditBonus = 100;
            loginCardBonus = randomCard("5G");
        } else if (userData.streak.login % 50 == 0) {
            loginCreditBonus = 150;
            loginCardBonus = randomCard("signal");
        } else if (isBooster && userData.streak.login % 3 == 0) {
            loginCreditBonus = 50;
            loginCardBonus = randomCard("LTE");
        }
        if (loginCardBonus != "" && loginCreditBonus != 0) {
            userData.wallet += loginCreditBonus;
            if (!userData.cards.some(card => card.code === loginCardBonus)) {
                userData.cards.push({code: loginCardBonus, count: 1});
            } else {
                userData.cards.find(card => card.code === loginCardBonus).count += 1;
            }
            embed.setFooter({ text: `Streak Bonus: Card ${loginCardBonus} and ${loginCreditBonus} credits!`});
        }
         // Reset streak if cooldown was broken
        if (userData.cooldown.login - Date.now() > 86400000) {
                userData.streak.login = 0;
        }
        
        // 🔄 Increment streak FIRST
        userData.streak.login++;

        // Reset streak if cooldown was broken
        if (userData.cooldown.login - Date.now() > 86400000) {
    userData.streak.login = 0;
        }

        // 🔄 Increment streak FIRST
        userData.streak.login++;

        // 🎁 Then check for streak bonuses based on updated value
        if (userData.streak.login == 10) {
        loginCreditBonus = 50;
        loginCardBonus = randomCard("3G");
        }

        embed.setTitle('Login verified!');
        embed.setDescription(
`**${credits}** credits have been added to your wallet!

-# You have logged in for **${userData.streak.login}** days.
-# You currently have ${userData.wallet} credits in your wallet.`
        );
        userData.cooldown.login = setCooldown(userId, 'login', 1440); // 24 hours cooldown
    }


    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(userData, null, 2));
    await message.reply({ embeds: [embed] });
}

export{
    login,
};