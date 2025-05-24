import { EmbedBuilder } from 'discord.js';

export function help(message) {
    const embed = new EmbedBuilder()
        .setColor('#52A5FF')
        .setTitle('Command List')
        .addFields(
            { 
                name: '🎮 Getting Started', 
                value: '`.start` - Create your account\n`.help` - Show this help menu\n`.d, .drop` - Drop cards to collect\n`.pd` - Paid drop (250 credits)\n`.boostdrop` - Drop cards to collect but exclusive to server boosters\n`.inv [filter]` - View inventory (g=group/n=name/r=rarity)\n`.v, .view <code>` - View card details'
            },
            {
                name: '👤 Profile & Customization',
                value: '`.p, .profile` - View your profile\n`.pc <code>` - Set profile card\n`.bio <text>` - Set profile bio\n`.colour <part> <#hex>` - Customize profile colors\n(parts: text/background1/background2/border1/border2)'
            },
            {
                name: '💰 Economy & Trading',
                value: '`.bal, .balance` - Check balances\n`.deposit <amount>` - To e-wallet\n`.withdraw <amount>` - To wallet\n`.pay <@user> <amount>` - Send credits\n`.g, .gift <@user> <card> [amount]` - Gift cards\n`.shop` - View shop\n`.buy <item> [amount]` - Buy items\n`.s, .sell <card> [amount] [price]` - Sell cards'
            },
            {
                name: '📦 Card Management',
                value: '`.burn <card> [amount/all/dupes]` - Delete cards\n`.stash` - View card packs\n`.open <pack>` - Open card pack\n`.sync` - Sync inventory\n`.transfer <@from> <@to>` - Transfer all items'
            },
            {
                name: '📋 Collection Features',
                value: '`.hl, .hoardlist` - View hoard list\n`.hset <cards,>` - Set hoard list\n`.ha <card>` - Add to hoard\n`.hr <card>` - Remove from hoard\n`.prog, .progress [group]` - Collection progress\n`.lb, .leaderboard [category]` - Rankings'
            },
            {
                name: '⏰ Timers & Rewards',
                value: '`.cd, .cooldown` - Check cooldowns\n`.rem, .reminder <cmd> <time>` - Set reminder\n`.login` - Daily login\n`.checkin` - Weekly rewards\n`.boost` - Booster rewards\n`.staff` - Staff rewards'
            },
            {
                name: '👑 Staff Commands',
                value: '`.uploadcard <rarity>, <series>, <group>, <era>, <name>` - Add card\n`.deletecard <code>` - Remove card\n`.editcardcode <old> <new>` - Change code\n`.ashop "<name>" "<desc>" <price> <code> <amount> <rarities>` - Add shop item\n`.rshop <code>` - Remove shop item\n`.arc, .archive <series>` - Archive series\n`.unarc, .unarchive <series>` - Unarchive series\n`.varc, .viewarchive` - View archives'
            },
            {
                name: '⚔️ Moderation',
                value: '`.timeout <@user> <time>` - Timeout\n`.warn <@user>` - Warn user\n`.blacklist <@user>` - Blacklist\n`.unblacklist <@user>` - Unblacklist\n`.givecard <@user> <card> [amount]` - Give cards\n`.removecard <@user> <card> [amount]` - Remove cards\n`.add <@user> <amount>` - Add credits\n`.sub <@user> <amount>` - Remove credits\n`.rcd, .resetcd <@user> [cmd]` - Reset cooldown\n`.setlogin <@user> <streak>` - Set streak\n`.delete <@user>` - Delete user data\n`.send <ch> <msg>` - Send message'
            }
        )
        .setFooter({ 
            text: 'Parameters: <required> [optional] | Prefix: . | Time format: 1h, 2d | Filters: g=group, n=name, r=rarity'
        });-

    message.reply({ embeds: [embed] });
}

export{
    help
};