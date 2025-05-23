import fs from 'fs';

function removeCard(message, userId, code, amount) {
    const hasAdminRole = message.member.roles.cache.some(role =>
        role.name === "head admin" || role.name === "community staff"
    );
    const isHeadAdmin = message.member.roles.cache.some(role => role.name === "head admin");

    if (!hasAdminRole) {
        message.reply('You are not allowed to use this!');
        return;
    }

    if (!userId || !code || !amount) {
        message.channel.send('Usage: `.removecard <@username/User ID> <code> <specific number>`');
        return;
    }

    if (userId.startsWith('<@')) {
        userId = userId.replace(/[<@&>]/g, '');
    } else if (userId.startsWith('@')) {
        userId = userId.replace(/[@]/g, '');
    }
    
    if (!userId.match(/^\d+$/)) {
        message.channel.send('Invalid user ID!');
        return;
    }
    if (userId === message.author.id) {
        message.channel.send('You cannot remove cards from yourself!');
        return;
    }
    // check if userId is a valid user with fs
    if (!fs.existsSync(`./inventory/${userId}.json`)) {
        message.channel.send('User not in database!');
        return;
    }
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
    var validCard = metadata.findIndex(card => card.code === code) !== -1;
    if (!validCard) {
        message.channel.send('Invalid card code!');
        return;
    }
    // check if ammount is valid
    amount = Math.abs(parseInt(amount));
    if (isNaN(amount) || amount <= 0) {
        message.channel.send(`You cannot remove ${amount} cards!`);
        return;
    }
    const receiverData = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    const receiverCardIndex = receiverData.cards.findIndex(card => card.code === code);
    if (receiverCardIndex !== -1) {
        receiverData.cards[receiverCardIndex].count -= amount;
        if (receiverData.cards[receiverCardIndex].count <= 0) {
            receiverData.cards.splice(receiverCardIndex, 1);
        }
    } else {
        message.channel.send('User does not have this card!');
        return;
    }
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(receiverData, null, 2));
    message.channel.send(`Removed ${amount}x of card ${code} from <@${userId}>!`);
}

export{
    removeCard
};