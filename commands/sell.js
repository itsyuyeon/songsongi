// src/commands/sell.js
import fs from 'fs';
import { EmbedBuilder } from 'discord.js';

export async function sell(message, userId, ...params) {
  // 1) Validate & normalize target user
  if (!userId) {
    return message.channel.send('Usage: `.sell <@user> <cards...>`');
  }
  if (userId.startsWith('<@')) userId = userId.replace(/[<@!>]/g, '');
  if (!/^\d+$/.test(userId)) {
    return message.channel.send('Invalid user mention or ID.');
  }
  if (userId === message.author.id) {
    return message.channel.send('You cannot sell to yourself.');
  }
  const invPath = `./inventory/${userId}.json`;
  if (!fs.existsSync(invPath)) {
    return message.channel.send('That user has no inventory.');
  }

  // 2) Load data
  const senderPath = `./inventory/${message.author.id}.json`;
  const senderData = JSON.parse(fs.readFileSync(senderPath, 'utf8'));
  const receiverData = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));

  // 3) Parse params into a list of { code, amount }
  let items = [];

  const last = params[params.length - 1]?.toLowerCase();
  // 3a) Group‐sale branch
  if (params[0]?.toLowerCase() === 'g') {
    const prefix = params[1];
    const action = params[2]?.toLowerCase();
    if (!prefix || !['all', 'dupes'].includes(action)) {
      return message.channel.send('Usage: `.sell @user g <prefix> all|dupes`');
    }
    // find all sender cards matching prefix
    const matches = senderData.cards.filter(c => c.code.startsWith(prefix));
    if (!matches.length) {
      return message.channel.send(`No cards found with prefix \`${prefix}\`.`);
    }
    for (const { code, count } of matches) {
      let amt = action === 'all'
        ? count
        : Math.max(0, count - 1);
      if (amt > 0) items.push({ code, amount: amt });
    }
  }
  // 3b) Unlimited codes + global action
  else if (['all', 'dupes'].includes(last)) {
    const action = last;
    const codes = params.slice(0, -1);
    if (!codes.length) {
      return message.channel.send('You must specify at least one code.');
    }
    for (const code of codes) {
      const meta = metadata.find(c => c.code === code);
      if (!meta) return message.channel.send(`Invalid code: \`${code}\`.`);
      const own = senderData.cards.find(c => c.code === code)?.count || 0;
      if (!own) return message.channel.send(`You don’t have any \`${code}\`.`);
      let amt = action === 'all' ? own : Math.max(0, own - 1);
      if (amt > 0) items.push({ code, amount: amt });
    }
  }
  // 3c) Code/amount pairs
  else {
    if (params.length % 2 !== 0) {
      return message.channel.send('For specific sells, use pairs: `<code> <amount>`.');
    }
    for (let i = 0; i < params.length; i += 2) {
      const code = params[i];
      const amt = parseInt(params[i+1], 10);
      if (isNaN(amt) || amt < 1) {
        return message.channel.send(`Invalid amount for ${code}: \`${params[i+1]}\`.`);
      }
      const meta = metadata.find(c => c.code === code);
      if (!meta) return message.channel.send(`Invalid code: \`${code}\`.`);
      const own = senderData.cards.find(c => c.code === code)?.count || 0;
      if (own < amt) {
        return message.channel.send(`You only have ${own} of \`${code}\`, cannot sell ${amt}.`);
      }
      items.push({ code, amount: amt });
    }
  }

  // 4) Perform the sale
  let totalCredits = 0;
  for (const { code, amount } of items) {
    // remove from sender
    const idx = senderData.cards.findIndex(c => c.code === code);
    senderData.cards[idx].count -= amount;
    if (senderData.cards[idx].count <= 0) {
      senderData.cards.splice(idx, 1);
    }
    // add to receiver
    const rIdx = receiverData.cards.findIndex(c => c.code === code);
    if (rIdx === -1) {
      receiverData.cards.push({ code, count: amount });
    } else {
      receiverData.cards[rIdx].count += amount;
    }
    // compute credit
    let creditPer = 0;
    if (code.startsWith('3G')) creditPer = 100;
    else if (code.startsWith('4G')) creditPer = 200;
    else if (code.startsWith('5G')) creditPer = 400;
    totalCredits += creditPer * amount;
  }

  // 5) Respect hoard limits on receiver
  const now = Date.now();
  if (now > receiverData.hoard.reset) {
    receiverData.hoard.reset = now + 86400000;
    receiverData.hoard.remaining = Math.min(receiverData.wallet, receiverData.hoard.limit);
  }
  if (totalCredits > receiverData.hoard.remaining) {
    return message.channel.send(
      `This sale would exceed <@${userId}>\’s hoard remaining (\`${receiverData.hoard.remaining}\` credits).`
    );
  }
  receiverData.hoard.remaining -= totalCredits;
  senderData.wallet += totalCredits;

  // 6) Persist & confirm
  fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));
  fs.writeFileSync(senderPath, JSON.stringify(senderData, null, 2));

  const embed = new EmbedBuilder()
    .setTitle('🛒 Sale Complete')
    .setDescription(
      `You sold:\n` +
      items.map(i => `• ${i.amount}× \`${i.code}\``).join('\n') +
      `\n\nto <@${userId}> for **${totalCredits}** credits.`
    )
    .setColor('#00AA00');
  message.channel.send({ embeds: [embed] });
}
