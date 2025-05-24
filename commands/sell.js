import fs from 'fs';

/**
 * .sell <@user> g <prefix> all|dupes
 * .sell <@user> <code> [<code>…] [all|dupes]
 * .sell <@user> <code> <amt> [<code> <amt>…]
 */
export function sell(message, userId, ...args) {
  // —————————————— validate mention/ID ——————————————
  if (!userId) {
    return message.channel.send('Usage: `.sell <@username/User ID> <…>`');
  }
  if (userId.startsWith('<@')) userId = userId.replace(/[<@&>]/g, '');
  else if (userId.startsWith('@')) userId = userId.slice(1);
  if (!/^\d+$/.test(userId)) {
    return message.channel.send('Invalid user ID!');
  }
  if (userId === message.author.id) {
    return message.channel.send("You can't sell cards to yourself!");
  }
  const invPath = `./inventory/${userId}.json`;
  if (!fs.existsSync(invPath)) {
    return message.channel.send('That user has no inventory.');
  }

  // —————————————— load data ——————————————
  const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
  const senderData = JSON.parse(fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8'));
  const receiverData = JSON.parse(fs.readFileSync(invPath, 'utf8'));

  // —————————————— group-sale? .sell @u g PREFIX all|dupes ——————————————
  // …inside sell(message, userId, ...args)

if (args[0]?.toLowerCase() === 'g') {
  const prefix = args[1]?.toUpperCase();
  const flag   = args[2]?.toLowerCase();
  if (!prefix || prefix.length !== 4 || !['all','dupes'].includes(flag)) {
    return message.channel.send('Usage: `.sell @user g <4-char prefix> all/dupes`');
  }

  // only match on first 4 chars
  const matches = senderData.cards.filter(c => c.code.slice(0, 4) === prefix);
  if (!matches.length) {
    return message.channel.send(`No cards whose code starts with \`${prefix}\`.`);
  }

  // build sales list
  const sales = matches.map(({ code, count }) => {
    const amt = flag === 'all'
      ? count
      : Math.max(0, count - 1);
    return { code, amt };
  }).filter(s => s.amt > 0);
}
    return processSales(message, sales, senderData, receiverData, metadata, userId);
  }

  // —————————————— parse general args ——————————————
  // detect final global flag
  let globalFlag = null;
  if (['all','dupes'].includes(args.slice(-1)[0]?.toLowerCase())) {
    globalFlag = args.pop().toLowerCase();
  }

  // if the second token is a number, we do <code> <amt> pairs
  let sales = [];
  if (args.length >= 2 && /^\d+$/.test(args[1])) {
    for (let i = 0; i < args.length; i += 2) {
      const code = args[i].toUpperCase();
      const amt  = Math.abs(parseInt(args[i+1]));
      sales.push({ code, amt });
    }
  } else {
    // otherwise each arg is a code, amount based on globalFlag or default 1
    for (let codeArg of args) {
      const code = codeArg.toUpperCase();
      let amt = 1;
      if (globalFlag === 'all')    amt = senderData.cards.find(c => c.code===code)?.count || 0;
      else if (globalFlag === 'dupes') amt = Math.max(0,(senderData.cards.find(c => c.code===code)?.count||0)-1);
      sales.push({ code, amt });
    }
  }

  // must have at least one sale
  if (!sales.length) {
    return message.channel.send('No valid codes or amounts provided.');
  }

  return processSales(message, sales, senderData, receiverData, metadata, userId);

// —————————————— shared sale logic ——————————————
function processSales(message, sales, senderData, receiverData, metadata, receiverId) {
  // validate each
  let totalCredits = 0;
  const prices = code => code.startsWith('3G') ? 100
                    : code.startsWith('4G') ? 200
                    : code.startsWith('5G') ? 400
                    : 0;

  for (let { code, amt } of sales) {
    const cardMeta = metadata.find(c => c.code === code);
    if (!cardMeta) {
      return message.channel.send(`Invalid card code: \`${code}\``);
    }
    const owned = senderData.cards.find(c => c.code === code)?.count || 0;
    if (amt > owned) {
      return message.channel.send(`You only have ${owned} of \`${code}\`, can't sell ${amt}.`);
    }
    totalCredits += prices(code) * amt;
  }

  // handle hoard/reset
  const now = Date.now();
  if (now > receiverData.hoard.reset) {
    receiverData.hoard.reset = now + 86400000;
    receiverData.hoard.remaining = Math.min(receiverData.wallet, receiverData.hoard.limit);
    receiverData.wallet -= receiverData.hoard.remaining;
  }
  if (totalCredits > receiverData.hoard.remaining) {
    return message.channel.send(
      `Transaction exceeds their hoard limit: they have ${receiverData.hoard.remaining} credits left.`
    );
  }

  // perform transfers
  for (let { code, amt } of sales) {
    // remove from sender
    const sIdx = senderData.cards.findIndex(c => c.code === code);
    senderData.cards[sIdx].count -= amt;
    if (senderData.cards[sIdx].count <= 0) {
      senderData.cards.splice(sIdx, 1);
    }
    // add to receiver
    const rIdx = receiverData.cards.findIndex(c => c.code === code);
    if (rIdx >= 0) receiverData.cards[rIdx].count += amt;
    else receiverData.cards.push({ code, count: amt });
  }

  // adjust wallets & hoard
  senderData.wallet += totalCredits;
  receiverData.hoard.remaining -= totalCredits;

  // save both
  fs.writeFileSync(`./inventory/${message.author.id}.json`,
    JSON.stringify(senderData, null, 2));
  fs.writeFileSync(`./inventory/${receiverId}.json`,
    JSON.stringify(receiverData, null, 2));

  // reply
  const summary = sales
    .map(s => `${s.amt}×${s.code}`)
    .join(', ');
  message.channel.send(
    `Sold ${summary} to <@${receiverId}> for ${totalCredits} credits!`
  );
}

