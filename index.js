require('dotenv').config(); // MUST be at the top!

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// DEBUG: check if token is loaded
console.log("✅ TOKEN loaded:", !!process.env.TOKEN); // true = OK, false = not found

if (!process.env.TOKEN) {
  console.error('❌ TOKEN is missing. Set it in Railway Variables.');
  process.exit(1);
}

client.login(process.env.TOKEN);

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(config.prefix)) { // Check if the message starts with the prefix
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        // Check if the user is in the database
        if (command === 'start') {
            cmd.start(message);
            return;
        }
        if (!cmd.hasStarted(message.author.id)) {
            return cmd.notStartedMessage(message);
        }
        // Check if the user is timed out
        if (cmd.isTimeout(message.author.id)) {
            return cmd.timeoutMessage(message);
        } else {
            cmd.removeTimeout(message.author.id);
        }
        // Check if the user is blacklisted
        if (cmd.isBlacklisted(message.author.id)) {
            return cmd.blacklistMessage(message);
        }

        switch (command) {
            case 'd':
            case 'drop':
            case 'DROP':
            case 'D':
                if (!inCorrectChannel(message, 'drop')) return;
                if (cmd.isCooldown(message.author.id, 'drop')) {
                    return cmd.cooldownMessage(message, 'drop');
                } else {
                    cmd.setCooldown(message.author.id, 'drop', 5);
                }
                cmd.drop(message);
                cmd.setReminder(message.author.id, 'drop', 5);
                break;
            case 'inv':
            case 'i':
            case 'inventory':
            case 'INV':
            case 'I':
                cmd.inventory(message, args[0]);break;
            case 'shop':
                if (!inCorrectChannel(message, 'shop')) return;
                cmd.shop(message);break;
            case 'buy':
                if (!inCorrectChannel(message, 'buy')) return;
                cmd.buy(message, args[0], args[1]);break;
            case 'g':
            case 'gift':
            case 'G':
            case 'GIFT':
                cmd.gift(message, args[0], args[1], args[2]);break;
            case 'pay':
            case 'p':
            case 'PAY':
                cmd.pay(message, args[0], args[1]);break;
            case 'uploadcard':
                var commaArgs = args.join(' ').split(', ');
                cmd.uploadCard(message, commaArgs[0], commaArgs[1], commaArgs[2], commaArgs[3], commaArgs[4]);break;
            case 'deletecard':
                cmd.deleteCard(message, args[0]);break;
            case 'stash':
                if (!inCorrectChannel(message, 'stash')) return;
                cmd.stash(message);break;
            case 'open':
                if (!inCorrectChannel(message, 'open')) return;
                cmd.open(message, args[0]);break;
            case 'help':
                cmd.help(message);break;
            case 'math':
                cmd.math(message, args);break;
            case 'delete':
                cmd.del(message, args[0]);break;
            case 'transfer':
                cmd.transfer(message, args[0], args[1]);break;
            case 'timeout':
                cmd.timeout(message, args[0], args[1]);break;
            case 'blacklist':
                cmd.blacklist(message, args[0]);break;
            case 'unblacklist':
                cmd.unblacklist(message, args[0]);break;
            case 'send':
                cmd.send(message, args[0], args.slice(1).join(' '));break;
            case 'warn':
                cmd.warn(message, args[0]);break;
            case 'profile':
            case 'p':
                cmd.profile(message);break;
            case 'bio':
                cmd.bio(message, args.join(' '));break;
            case 'pc':
                cmd.profileCard(message, args[0]);break;
            case 'view':
            case 'v':
                if (!inCorrectChannel(message, 'view')) return;
                cmd.view(message, args[0]);break;
            case 'colour':
                cmd.colour(message, args[0], args[1]);break;
            case 'cd':
            case 'cooldown':
            case 'CD':
                if (!inCorrectChannel(message, 'cd')) return;
                cmd.cooldown(message);break;
            case 'editcardcode':
                cmd.editCardCode(message, args[0], args[1]);break;
            case 'pd':
                if (!inCorrectChannel(message, 'pd')) return;
                if (cmd.isCooldown(message.author.id, 'drop')) {
                    return cmd.cooldownMessage(message, 'drop');
                } else {
                    cmd.setCooldown(message.author.id, 'drop', 0.5);
                }
                cmd.paidDrop(message);
                cmd.setReminder(message.author.id, 'drop', 0.5);
                break;
            case 'reminder':
            case 'rem':
                if (!inCorrectChannel(message, 'rem')) return;
                cmd.reminder(message, args[0], args[1]);break;
            case 'leaderboard':
            case 'lb':
                cmd.leaderboard(message, args[0]);break;
            case 'progress':
            case 'prog':
                cmd.progress(message, args.join(' '));break;
            case 'balance':
            case 'bal':
                cmd.balance(message);break;
            case 'deposit':
                if (!inCorrectChannel(message, 'deposit')) return;
                cmd.deposit(message, args[0]);break;
            case 'withdraw':
                if (!inCorrectChannel(message, 'withdraw')) return;
                cmd.withdraw(message, args[0]);break;
            case 'login':
                if (!inCorrectChannel(message, 'login')) return;
                cmd.login(message);
                cmd.setReminder(message.author.id, 'login', 86400);
                break;
            case 'sync':
                if (!inCorrectChannel(message, 'sync')) return;
                cmd.sync(message);
                cmd.setReminder(message.author.id, 'sync', 60);
                break;
            case 'burn':
                if (!inCorrectChannel(message, 'burn')) return;
                cmd.burn(message, args);break;
            case 'hoardlist':
            case 'hl':
                cmd.hoardList(message);break;
            case 'hset':
                cmd.hoardSet(message, args[0]);break;
            case 'ha':
                cmd.hoardAdd(message, args[0]);break;
            case 'hr':
                cmd.hoardRemove(message, args[0]);break;
            case 'sell':
            case 's':
                cmd.sell(message, args[0], args[1], args[2]);break;
            case 'checkin':
                if (!inCorrectChannel(message, 'checkin')) return;
                if (cmd.isCooldown(message.author.id, 'checkin')) {
                    return cmd.cooldownMessage(message, 'checkin');
                } else {
                    cmd.setCooldown(message.author.id, 'checkin', 10080);// 7 day cooldown
                }
                cmd.checkin(message);
                cmd.setReminder(message.author.id, 'checkin', 10080);
                break;
            case 'boost':
                if (!inCorrectChannel(message, 'boost')) return;
                if (cmd.isCooldown(message.author.id, 'boost')) {
                    return cmd.cooldownMessage(message, 'boost');
                } else {
                    cmd.setCooldown(message.author.id, 'boost', 10080);// 7 day cooldown
                }
                cmd.boost(message);
                cmd.setReminder(message.author.id, 'boost', 10080);
                break;
            case 'staff':
                if (cmd.isCooldown(message.author.id, 'staff')) {
                    return cmd.cooldownMessage(message, 'staff');
                } else {
                    cmd.setCooldown(message.author.id, 'staff', 20160);// 14 day cooldown
                }
                cmd.staff(message);
                cmd.setReminder(message.author.id, 'staff', 20160);
                break;
            case 'givecard':
                cmd.giveCard(message, args[0], args[1], args[2]);break;
            case 'removecard':
                cmd.removeCard(message, args[0], args[1], args[2]);break;
            case 'add':
                cmd.add(message, args[0], args[1]);break;
            case 'sub':
                cmd.sub(message, args[0], args[1]);break;
            case 'rcd':
            case 'resetcd':
                cmd.resetCooldown(message, args[0], args[1]);break;
            case 'setlogin':
                cmd.setLogin(message, args[0], args[1]);break;
            case 'ashop':
                // Extract name in quotes
                var arguments = args;
                let nameMatch = arguments.join(' ').match(/"([^"]+)"/);
                if (!nameMatch) return message.reply('Invalid format. Name must be in quotes.');
                let name = nameMatch[1];
                // Remove name from arguments
                arguments = arguments.join(' ').replace(`"${name}"`, '').trim().split(' ');
                // let name = arguments.shift();
                let descriptionMatch = arguments.join(' ').match(/"([^"]+)"/);
                if (!descriptionMatch) return message.reply('Invalid format. Description must be in quotes.');
                let description = descriptionMatch[1];
                // Remove description from arguments
                arguments = arguments.join(' ').replace(`"${description}"`, '').trim().split(' ');
                // Get remaining parameters
                let price = arguments.shift();
                let code = arguments.shift();
                let amount = arguments.shift();
                let rarities = arguments.join(' ');
                cmd.addShop(message, name, description, price, code, amount, rarities);break;
            case 'rshop':
                cmd.removeShop(message, args[0]);break;
            case 'viewarchive':
            case '.varc':
                cmd.viewArchive(message);break;
            case 'archive':
            case 'arc':
                cmd.archive(message, args.join(" "));break;
            case 'unarchive':
            case 'unarc':
                cmd.unarchive(message, args.join(" "));break;
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
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() && !interaction.isAnySelectMenu()) return;
    if (interaction.customId.startsWith('pick_')) {
        cmd.handleButtonInteraction(interaction);
    }
    if (interaction.customId.startsWith('buy_')) {
        cmd.buy(interaction, interaction.customId.split('_')[1], 1);
    }
    if (interaction.customId === "filter") {
        cmd.filter(interaction);
    }
});

cmd.reminderLoop(client); // Start the reminder loop

// There is always a little bit of time between then and now, so keep going! :)
// https://docs.google.com/spreadsheets/d/1uE0NpfRrrynJOY0VWlsgubuu4wPpg_XVNSZ2uyyd4Fw/edit?usp=sharing

// remaining things todo:
//  - mod log for transactions
//  - emojis
//  - format numbers
//  - server wise
//  - claim/booster claim cooldown
//  - pitty system
//  - goodnight boostgoodnight command
//  - task command