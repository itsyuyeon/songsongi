import fs from 'fs';

/**
 * Gift cards to another user with flexible options:
 *
 * 1. Group sale: `.gift <@user> g <prefix> <all|dupes>`
 * 2. Multiple codes with global spec: `.gift <@user> <code> <code> ... <all|dupes>`
 * 3. Code/amount pairs: `.gift <@user> <code> <amount> [<code> <amount>]...`
 */
export function gift(message, args) {
  if (args.length < 2) {
    return message.channel.send(
      'Usage: `.gift <@user> g <prefix> <all|dupes>` or `.gift <@user> <code> <amount> [<code> <amount>]...` or `.gift <@user> <code> <code> ... <all|dupes>`'
    );
  }

  // Resolve target user ID
  let userId = args[0];
  if (userId.startsWith('<@')) userId = userId.replace(/[<@!>]/g, '');
  if (!/^[0-9]+$/.test(userId)) return message.channel.send('Invalid user ID!');
  if (userId === message.author.id) return message.channel.send('You cannot gift cards to yourself!');

  const invPath = `./inventory/${userId}.json`;
  if (!fs.existsSync(invPath)) return message.channel.send('User not in database!');

  // Load inventories and metadata
  const senderData = JSON.parse(
    fs.readFileSync(`./inventory/${message.author.id}.json`, 'utf8')
  );
  const receiverData = JSON.parse(fs.readFileSync(invPath, 'utf8'));
  const metadata = JSON.parse(
    fs.readFileSync('./cards/metadata.json', 'utf8')
  );

  // Directives after the user mention
  const directives = args.slice(1);
  const summary = [];

  // 1) Group sale: `g <prefix> <all|dupes>`
  if (directives[0].toLowerCase() === 'g') {
    if (directives.length !== 3)
      return message.channel.send(
        'Usage: `.gift <@user> g <prefix> <all|dupes>`'
      );
    const prefix = directives[1].toLowerCase();
    const spec = directives[2].toLowerCase();
    if (!['all', 'dupes'].includes(spec))
      return message.channel.send('Specify `all` or `dupes`.');

    // Find matching cards in sender's inventory
    const matches = senderData.cards.filter((c) =>
      c.code.toLowerCase().startsWith(prefix)
    );
    if (!matches.length)
      return message.channel.send(`No cards found with prefix \`${prefix}\`.`);

    matches.forEach((card) => {
      let giveCount = 0;
      if (spec === 'all') {
        giveCount = card.count;
      } else {
        // dupes: leave one behind
        if (card.count <= 1) return;
        giveCount = card.count - 1;
      }
      if (giveCount <= 0) return;

      // Deduct from sender
      card.count -= giveCount;
      summary.push(`${giveCount}× ${card.code}`);
    });
  }
  // 2) Codes with global spec: last directive is all/dupes
  else if (
    directives.length >= 2 &&
    ['all', 'dupes'].includes(directives[directives.length - 1].toLowerCase())
  ) {
    const spec = directives[directives.length - 1].toLowerCase();
    const codes = directives.slice(0, -1);

    codes.forEach((input) => {
      const matched = metadata.find(
        (c) => c.code.toLowerCase() === input.toLowerCase()
      );
      if (!matched) {
        message.channel.send(`Invalid code: \`${input}\``);
        return;
      }
      const code = matched.code;
      const senderCard = senderData.cards.find((c) => c.code === code);
      if (!senderCard) {
        message.channel.send(
          `You do not have card: \`${code}\``
        );
        return;
      }

      let giveCount = 0;
      if (spec === 'all') giveCount = senderCard.count;
      else {
        if (senderCard.count <= 1) {
          message.channel.send(
            `You don't have dupes of \`${code}\` to gift.`
          );
          return;
        }
        giveCount = senderCard.count - 1;
      }
      senderCard.count -= giveCount;
      summary.push(`${giveCount}× ${code}`);
    });
  }
  // 3) Code/amount pairs
  else if (directives.length % 2 === 0) {
    for (let i = 0; i < directives.length; i += 2) {
      const input = directives[i];
      const amtStr = directives[i + 1].toLowerCase();

      const matched = metadata.find(
        (c) => c.code.toLowerCase() === input.toLowerCase()
      );
      if (!matched) {
        message.channel.send(`Invalid code: \`${input}\``);
        continue;
      }
      const code = matched.code;
      const senderCard = senderData.cards.find((c) => c.code === code);
      if (!senderCard) {
        message.channel.send(
          `You do not have card: \`${code}\``
        );
        continue;
      }

      let giveCount = 0;
      if (amtStr === 'all') {
        giveCount = senderCard.count;
      } else if (amtStr === 'dupes') {
        if (senderCard.count <= 1) {
          message.channel.send(
            `You don't have dupes of \`${code}\` to gift.`
          );
          continue;
        }
        giveCount = senderCard.count - 1;
      } else {
        const num = parseInt(amtStr);
        if (
          isNaN(num) ||
          num <= 0 ||
          num > senderCard.count
        ) {
          message.channel.send(
            `Invalid amount for \`${code}\`.`
          );
          continue;
        }
        giveCount = num;
      }

      senderCard.count -= giveCount;
      summary.push(`${giveCount}× ${code}`);
    }
  } else {
    return message.channel.send(
      'Usage: `.gift <@user> g <prefix> <all|dupes>` or `.gift <@user> <code> <amount>...`'
    );
  }

  // Cleanup sender cards with zero count
  senderData.cards = senderData.cards.filter((c) => c.count > 0);

  // Apply to receiver inventory
  summary.forEach((entry) => {
    const [countStr, , code] = entry.split(' ');
    const count = parseInt(countStr.replace('×', ''), 10);
    const recvCard = receiverData.cards.find((c) => c.code === code);
    if (recvCard) recvCard.count += count;
    else receiverData.cards.push({ code, count });
  });

  // Save back to disk
  fs.writeFileSync(
    `./inventory/${message.author.id}.json`,
    JSON.stringify(senderData, null, 2)
  );
  fs.writeFileSync(
    invPath,
    JSON.stringify(receiverData, null, 2)
  );

  // Final reply
  if (summary.length) {
    message.channel.send(
      `${message.author.username} gifted:\n${summary
        .map((s) => `• ${s}`)
        .join('\n')} to <@${userId}>!`
    );
  } else {
    message.channel.send('No cards were gifted.');
  }
}
export {
  gift
};