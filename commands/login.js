// login.js
import fs from 'fs';
import { EmbedBuilder } from 'discord.js';
import { isCooldown, setCooldown } from './cooldown.js';

/**
 * Pick a random card code of the given rarity (or "signal" for 3G/4G/5G).
 */
export function randomCard(rarity) {
  const all = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
  let pool;
  if (rarity === 'signal') {
    pool = all.filter(c => ['3G','4G','5G'].includes(c.rarity));
  } else {
    pool = all.filter(c => c.rarity === rarity);
  }
  return pool[Math.floor(Math.random() * pool.length)].code;
}

/**
 * The `.login` command.
 */
export async function login(message) {
  const userId = message.author.id;
  const filePath = `./inventory/${userId}.json`;
  const userData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const embed = new EmbedBuilder().setColor('#FFEE52');
  const now = Date.now();

  // If still on cooldown, show time remaining + current streak/wallet
  if (isCooldown(userId, 'login')) {
    const secondsLeft = Math.ceil((userData.nextLogin - now)/1000);
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    embed
      .setTitle("⏳ You're already logged in")
      .setDescription(
        `Next login in \`${hours}h ${minutes}m\`.\n` +
        `- Streak: **${userData.streak.login}** days\n` +
        `- Wallet: \`${userData.wallet}\` credits`
      );
  } else {
    // Award normal daily credits
    const daily = Math.floor(Math.random()*(350-150+1)) + 150;
    userData.wallet += daily;

    // Check if streak was broken (>24h since lastLogin)
    if (userData.lastLogin && (now - userData.lastLogin) > 86400000) {
      userData.streak.login = 0;
    }

    // Increment streak
    userData.streak.login = (userData.streak.login || 0) + 1;

    // Calculate streak bonuses
    let bonusCredit = 0;
    let bonusCard = null;
    const s = userData.streak.login;
    const memberIsBooster = Boolean(message.member?.premiumSince);
    if (s === 10)          { bonusCredit =  50; bonusCard = randomCard('3G'); }
    else if (s === 20)     { bonusCredit =  70; bonusCard = randomCard('4G'); }
    else if (s === 30)     { bonusCredit = 100; bonusCard = randomCard('5G'); }
    else if (s % 50 === 0) { bonusCredit = 150; bonusCard = randomCard('signal'); }
    else if (memberIsBooster && s % 3 === 0) {
      bonusCredit = 50;
      bonusCard = randomCard('LTE');
    }

    // Apply bonus if earned
    if (bonusCredit > 0 && bonusCard) {
      userData.wallet += bonusCredit;
      const existing = userData.cards.find(c => c.code === bonusCard);
      if (existing) existing.count++;
      else userData.cards.push({ code: bonusCard, count: 1 });
      embed.setFooter({ text: `Streak bonus: +${bonusCredit} credits & card ${bonusCard}!` });
    }

    // Build success embed
    embed
      .setTitle('Login confirmed!')
      .setDescription(
        `You received **${daily}** credits!\n` +
        `- Streak: **${s}** days\n` +
        `- Wallet: \`${userData.wallet}\` credits`
      );

    // Persist next available login time in both memory & disk
    userData.nextLogin = now + 86400000;            // for display
    setCooldown(userId, 'login', 86400);            // in-memory map (seconds)
    userData.lastLogin = now;                       // for streak logic
  }

  // Write back to disk
  fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
  await message.reply({ embeds: [embed] });
}
