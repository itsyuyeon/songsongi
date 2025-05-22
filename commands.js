const {drop, handleButtonInteraction, paidDrop} = require("./commands/drop.js");
const {shop, addShop, removeShop} = require("./commands/shop.js");
const {inventory, filter} = require("./commands/inventory.js");
const {buy} = require("./commands/buy.js");
const {gift} = require("./commands/gift.js");
const {pay} = require("./commands/pay.js");
const {uploadCard, deleteCard, editCardCode} = require("./commands/card.js");
const {stash} = require("./commands/stash.js");
const {open} = require("./commands/open.js");
const {help} = require("./commands/help.js");
const {math} = require("./commands/math.js");
const {start, hasStarted, notStartedMessage} = require("./commands/start.js");
const {del} = require("./commands/delete.js");
const {transfer} = require("./commands/transfer.js");
const {timeout, removeTimeout, isTimeout, timeoutMessage} = require("./commands/timeout.js");
const {blacklist, unblacklist, isBlacklisted, blacklistMessage} = require("./commands/blacklist.js");
const {send} = require("./commands/send.js");
const {warn} = require("./commands/warn.js");
const {profile, bio, profileCard, colour} = require("./commands/profile.js");
const {view} = require("./commands/view.js");
const {cooldown, isCooldown, cooldownMessage, setCooldown} = require("./commands/cooldown.js");
const {reminder, setReminder, reminderLoop} = require("./commands/reminder.js");
const {leaderboard} = require("./commands/leaderboard.js");
const {progress} = require("./commands/progress.js");
const {balance} = require("./commands/balance.js");
const {deposit} = require("./commands/deposit.js");
const {withdraw} = require("./commands/withdraw.js");
const {login} = require("./commands/login.js");
const {sync} = require("./commands/sync.js");
const {burn} = require("./commands/burn.js");
const {hoardList, hoardSet, hoardAdd, hoardRemove} = require("./commands/hoard.js");
const {sell} = require("./commands/sell.js");
const {checkin} = require("./commands/checkin.js");
const {boost} = require("./commands/boost.js");
const {staff} = require("./commands/staff.js");
const {giveCard} = require("./commands/givecard.js");
const {removeCard} = require("./commands/removecard.js");
const {add} = require("./commands/add.js");
const {sub} = require("./commands/sub.js");
const {resetCooldown} = require("./commands/resetcooldown.js");
const {setLogin} = require("./commands/setlogin.js");
const {viewArchive, archive, unarchive} = require("./commands/archive.js");
const { claimCard } = require("./commands/claim.js");
// some of these aren't commands, but sub processes for commands
module.exports = {
    drop,
    claimCard,
    shop,
    inventory,
    buy,
    gift,
    pay,
    handleButtonInteraction,
    filter,
    uploadCard,
    deleteCard,
    stash,
    open,
    help,
    math,
    start,
    hasStarted,
    notStartedMessage,
    del,
    transfer,
    timeout,
    removeTimeout,
    isTimeout,
    timeoutMessage,
    blacklist,
    unblacklist,
    isBlacklisted,
    blacklistMessage,
    send,
    warn,
    profile,
    bio,
    profileCard,
    view,
    colour,
    cooldown,
    isCooldown,
    cooldownMessage,
    setCooldown,
    editCardCode,
    paidDrop,
    reminder,
    setReminder,
    reminderLoop,
    leaderboard,
    progress,
    balance,
    deposit,
    withdraw,
    login,
    sync,
    burn,
    hoardList,
    hoardSet,
    hoardAdd,
    hoardRemove,
    sell,
    checkin,
    boost,
    staff,
    giveCard,
    removeCard,
    add,
    sub,
    resetCooldown,
    setLogin,
    addShop,
    removeShop,
    viewArchive,
    archive,
    unarchive,

};