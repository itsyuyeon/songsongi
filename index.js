process
  .on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
  })
  .on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

import config from './config.json' assert { type: 'json' };
import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import * as cmd from './commands.js';               
import { inCorrectChannel, isAllowedChannel } from './channel.js';
import pool from './db.js';
import { reminderLoop, stopReminderLoop } from './commands/reminder.js';

process
  .on('uncaughtException', err => console.error('Uncaught Exception', err))
  .on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at', promise, 'reason:', reason);
  });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// start the reminder loop once we're ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  reminderLoop(client);
});

// graceful shutdown of the reminder loop
process.on('SIGINT',  () => { stopReminderLoop(); process.exit(0); });
process.on('SIGTERM', () => { stopReminderLoop(); process.exit(0); });

// login
client.login(process.env.TOKEN);

// test DB connection
(async () => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    console.log('✅ Connected to DB at:', rows[0].now);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!isAllowedChannel(message.channel.id)) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/\s+/);
  const command = args.shift().toLowerCase();

  // START handling
  if (command === 'start') {
    return cmd.start(message);
  }

  // require synced
  if (!await cmd.hasStarted(message.author.id)) {
    return cmd.notStartedMessage(message);
  }

  // timeouts & blacklist
  if (cmd.isTimeout(message.author.id)) return cmd.timeoutMessage(message);
  cmd.removeTimeout(message.author.id);
  if (cmd.isBlacklisted(message.author.id)) return cmd.blacklistMessage(message);

            switch (command) {
            case 'drop':
            case 'd':
                if (!inCorrectChannel(message, 'drop')) return;
                if (cmd.isCooldown(message.author.id, 'drop')) {
                    return cmd.cooldownMessage(message, 'drop');
                }
                cmd.setCooldown(message.author.id, 'drop', 5);
                try {
                await cmd.drop(message);
                } catch (err) {
                console.error('Error running .drop:', err);
                message.reply('Oh no, something went wrong with that drop command.');
                }
                cmd.setReminder(message.author.id, 'drop', 5);
            break;
                
            case 'inv':
            case 'i':
            case 'inventory':
            case 'INV':
            case 'I':
                await cmd.inventory(message);break; // Pass mention or ID if any 

            case 'shop':
            case 'Shop':
            case 'SHOP':
                if (!inCorrectChannel(message, 'shop')) return;
                await cmd.shop(message);
                break;

            case 'buy':
                if (!inCorrectChannel(message, 'buy')) return;
                await cmd.buy(message, args[0], args[1]);
                break;

            case 'g':
            case 'gift':
            case 'G':
            case 'GIFT':
                await cmd.gift(message, args[0], args[1], args[2]);
                break;

            case 'pay':
            case 'PAY':
                await cmd.pay(message, args[0], args[1]);
                break;

                
            case 'uploadcard': {
                const commaArgs = args.join(' ').split(', ');
                await cmd.uploadCard(
                message,
                commaArgs[0],
                commaArgs[1],
                commaArgs[2],
                commaArgs[3],
                commaArgs[4]
                );
                break;
            }

            case 'deletecard':
                await cmd.deleteCard(message, args[0]);
                break;

            case 'stash':
                if (!inCorrectChannel(message, 'stash')) return;
                await cmd.stash(message);
                break;

            case 'open':
                if (!inCorrectChannel(message, 'open')) return;
                await cmd.open(message, args[0]);
                break;

            case 'help':
                await cmd.help(message);
                break;

            case 'math':
                await cmd.math(message, args);break;

            case 'delete':
                await cmd.del(message, args[0]);break;

            case 'transfer':
                await cmd.transfer(message, args[0], args[1]);break;

            case 'timeout':
                await cmd.timeout(message, args[0], args[1]);break;

            case 'blacklist':
               await cmd.blacklist(message, args[0]);break;

            case 'unblacklist':
                await cmd.unblacklist(message, args[0]);break;

            case 'send':
                await cmd.send(message, args[0], args.slice(1).join(' '));break;

            case 'warn':
                await cmd.warn(message, args[0]);break;
                
            case 'profile':
            case 'p':
                await cmd.profile(message);break;

            case 'bio':
                await cmd.bio(message, args.join(' '));break;

            case 'fav':
            // .fav <code>  (same as favourite)
                await cmd.profileCard(message, args[0], null);
                 break;

            case 'pc':
                // .pc <code> <slot>
                 await cmd.profileCard(message, args[0], args[1]);
                 break;

            case 'view':
            case 'v':
                if (!inCorrectChannel(message, 'view')) return;
                await cmd.view(message, args[0]);
                break;

            case 'colour':
                await cmd.colour(message, args[0], args[1]);break;

            case 'cd':
            case 'cooldown':
            case 'CD':
                if (!inCorrectChannel(message, 'cd')) return;
                await cmd.cooldown(message);break;

            case 'editcardcode':
               await cmd.editCardCode(message, args[0], args[1]);break;

            case 'pd':
                if (!inCorrectChannel(message, 'pd')) return;
                if (cmd.isCooldown(message.author.id, 'paidDrop')) {
                    return cmd.cooldownMessage(message, 'paidDrop');
                }
                cmd.setCooldown(message.author.id, 'paidDrop', 0.5);
                await cmd.paidDrop(message);
                cmd.setReminder(message.author.id, 'pd', 0.5);
            break;

            case 'reminder':
            case 'rem':
                if (!inCorrectChannel(message,'rem')) return;
                await cmd.reminder(message, args[0], args[1]);
            break;

            case 'leaderboard':
            case 'lb':
                await cmd.leaderboard(message, args[0]);break;

            case 'progress':
            case 'prog':
                await cmd.progress(message, args.join(' '));break;

            case 'balance':
            case 'bal':
                await cmd.balance(message, args[0]); // Pass mention or ID if any   
                break;             

            case 'deposit':
                if (!inCorrectChannel(message, 'deposit')) return;
                await cmd.deposit(message, args[0]);break;

            case 'withdraw':
                if (!inCorrectChannel(message, 'withdraw')) return;
                await cmd.withdraw(message, args[0]);
                break;

            case 'login':
                if (!inCorrectChannel(message, 'login')) return;
                await cmd.login(message);
                cmd.setReminder(message.author.id, 'login', 24 * 60 * 60);;
                break;

            case 'sync':
                if (!inCorrectChannel(message, 'sync')) return;
                await cmd.sync(message);
                cmd.setReminder(message.author.id, 'sync', 60);
                break;

            case 'burn':
                if (!inCorrectChannel(message, 'burn')) return;
                await cmd.burn(message, args);
                break;

            case 'hoardlist':
            case 'hl':
                await cmd.hoardList(message);break;

            case 'hset':
                await cmd.hoardSet(message, args[0]);break;

            case 'ha':
                if (!inCorrectChannel(message, 'ha')) return;
                await cmd.hoardAdd(message, args[0]);
                break;

            case 'hr':
                if (!inCorrectChannel(message, 'ha')) return;
                await cmd.hoardRemove(message, args[0]);
                break;

            case 'sell':
            case 's':
                if (!inCorrectChannel(message, 'sell')) return;
                await cmd.sell(message, args[0], args[1], args[2]);
                break;

            case 'checkin':
                if (!inCorrectChannel(message, 'checkin')) return;
                if (cmd.isCooldown(message.author.id, 'checkin')) {
                return cmd.cooldownMessage(message, 'checkin');
                } else {
                cmd.setCooldown(message.author.id, 'checkin', 10080); // this one’s synchronous
                }
                await cmd.checkin(message);
                cmd.setReminder(message.author.id, 'checkin', 7 * 24 * 60 * 60);
                break;

            case 'boost':
                if (!inCorrectChannel(message, 'boost')) return;
                if (cmd.isCooldown(message.author.id, 'boost')) {
                    return cmd.cooldownMessage(message, 'boost');
                } else {
                    cmd.setCooldown(message.author.id, 'boost', 10080); // sync
                }
                await cmd.boost(message);
                cmd.setReminder(message.author.id, 'boost', 10080);
                break;

                case 'staff':
                if (cmd.isCooldown(message.author.id, 'staff')) {
                    return cmd.cooldownMessage(message, 'staff');
                } else {
                    cmd.setCooldown(message.author.id, 'staff', 20160); // sync
                }
                await cmd.staff(message);
                cmd.setReminder(message.author.id, 'staff', 14 * 24 * 60 * 60);
                break;

            case 'givecard':
                await cmd.giveCard(message, args[0], args[1], args[2]);break;

            case 'removecard':
                await cmd.removeCard(message, args[0], args[1], args[2]);break;

            case 'add':
                await cmd.add(message, args[0], args[1]);break;

            case 'sub':
                await cmd.sub(message, args[0], args[1]);break;

            case 'rcd':
            case 'resetcd':
                await cmd.resetCooldown(message, args[0], args[1]);break;

            case 'setlogin':
                await cmd.setLogin(message, args[0], args[1]);break;

            case 'ashop':
                // Extract name in quotes
                let cmdArgs = args;
                let nameMatch = cmdArgs.join(' ').match(/"([^"]+)"/);
                if (!nameMatch) return message.reply('Invalid format. Name must be in quotes.');
                let name = nameMatch[1];

                // Remove name from arguments
                cmdArgs = cmdArgs.join(' ').replace(`"${name}"`, '').trim().split(' ');

                let descriptionMatch = cmdArgs.join(' ').match(/"([^"]+)"/);
                    if (!descriptionMatch) return message.reply('Invalid format. Description must be in quotes.');
                let description = descriptionMatch[1];

                 // Remove description from arguments
                 cmdArgs = cmdArgs.join(' ').replace(`"${description}"`, '').trim().split(' ');

                 // Get remaining parameters
                let price = cmdArgs.shift();
                let code = cmdArgs.shift();
                let amount = cmdArgs.shift();
                let rarities = cmdArgs.join(' ');

                cmd.addShop(message, name, description, price, code, amount, rarities);
            break;

            case 'rshop':
                await cmd.removeShop(message, args[0]);break;

            case 'viewarchive':
            case '.varc':
                await cmd.viewArchive(message);break;

            case 'archive':
            case 'arc':
                await cmd.archive(message, args.join(" "));break;

            case 'unarchive':
            case 'unarc':
                await cmd.unarchive(message, args.join(" "));break;
                
            case 'bd':
            case 'boosterdrop':
                if (!inCorrectChannel(message, 'boosterdrop')) return;
                var isBooster = (message.member && message.member.premiumSince);
                if (!isBooster && !message.member.roles.cache.some(role => role.name === "syncer")) {
                    return message.reply("You must be a server booster or have the 'syncer' role to use this command.");
                }
                if (cmd.isCooldown(message.author.id, 'boosterDrop')) {
                    return cmd.cooldownMessage(message, 'boosterDrop');
                } else {
                    cmd.setCooldown(message.author.id, 'boosterDrop', 5);
                }
                cmd.drop(message);
                cmd.setReminder(message.author.id, 'boosterDrop', 5);
                break;

             case 'booster':
                cmd.booster(message);
                cmd.setReminder(message.author.id, 'booster', 7 * 24 * 60 * 60);
                break;

        }
    }
);

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected to DB at:', res.rows[0].now);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();

// interactionCreate for buttons & select menus
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('pick_')) {
      await cmd.handleButtonInteraction(interaction);
    }
    // inventory pagination buttons
    await cmd.handleInventoryInteraction(interaction);
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'filter_inv') {
      await cmd.handleFilterSelection(interaction);
    }
    if (interaction.customId.startsWith('buy_')) {
      await cmd.buy(interaction, interaction.customId.split('_')[1], 1);
    }
  }
});
