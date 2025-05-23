import fs from 'fs';

function generateCode(rarity, era, name) {
    let code = rarity;
    const eraMatch = era.match(/[A-Z]/g);
    const nameMatch = name.match(/[A-Z]/g);
    if (eraMatch && eraMatch.length > 1) {
        code += `${eraMatch[0]}${eraMatch[1]}`;
    } else {
        code += `${era.toUpperCase()[0]}${era.toUpperCase()[1]}`;
    }
    if (nameMatch && nameMatch.length > 1) {
        code += `${nameMatch[0]}${nameMatch[1]}`;
    } else {
        code += `${name.toUpperCase()[0]}${name.toUpperCase()[1]}`;
    }
    return code;
}

function uploadCard(message, rarity, series, group, era, name) {
    // Check if user has "Head Admins" role
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only Head Admins can use this command!');
        return;
    }

    // Validate inputs
    if (!rarity || !series || !group || !era || !name || !message.attachments.size) {
        message.reply('Usage: .uploadcard <3G/4G/5G/LTE>, <series>, <group>, <era>, <name> [attach an image]');
        return;
    }

    // generate code
    const code = generateCode(rarity, era, name);

    // Check if the card ID already exists
    if (fs.existsSync(`./cards/${code}.png`)) {
        message.reply(`A card with this code ${code} already exists!`);
        return;
    }
    
    const metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));

    // find another card with the same series and check if they are archived
    var isArchived = false;
    const seriesMatch = metadata.find(card => card.series === series);
    if (seriesMatch) {
        isArchived = seriesMatch.isArchived;
    }
    
    // Save the attached image
    const attachment = message.attachments.first();

    // Download the file
    const https = require('https');
    const file = fs.createWriteStream(`./cards/${code}.png`);
    https.get(attachment.url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            message.reply(`Card uploaded successfully as ${code}`);
        });
        metadata.push({
            code: code,
            rarity: rarity,
            group: group,
            era: era,
            idolname: name,
            series: series,
            price: 1,
            name: name,
            image: `./cards/${code}.png`,
            isArchived: isArchived,
        });
        fs.writeFileSync('./cards/metadata.json', JSON.stringify(metadata, null, 2));
    }).on('error', (err) => {
        fs.unlink(`./cards/${code}.png`, () => {}); // Delete the file if an error occurs
        message.reply('Failed to upload the card. Please try again.');
    });
}

function deleteCard(message, code) {
    // Check if user has "Head Admins" role
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only Head Admins can use this command!');
        return;
    }

    // Validate inputs
    if (!code) {
        message.reply('Usage: .deletecard <code>');
        return;
    }

    // Find and delete the card
    if (fs.existsSync(`./cards/${code}.png`)) {
        fs.unlinkSync(`./cards/${code}.png`);
        var metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
        metadata = metadata.filter(card => card.code !== code);
        fs.writeFileSync('./cards/metadata.json', JSON.stringify(metadata, null, 2));
        
        const userFiles = fs.readdirSync('./inventory');
        userFiles.forEach(file => {
            const userData = JSON.parse(fs.readFileSync(`./inventory/${file}`, 'utf8'));
            const cardIndex = userData.cards.findIndex(card => card.code === code);
            if (cardIndex !== -1) {
                userData.cards.splice(cardIndex, 1);
                fs.writeFileSync(`./inventory/${file}`, JSON.stringify(userData, null, 2));
            }
        });
        message.reply(`Card with code ${code} has been deleted.`);
    } else {
        message.reply('Card code not found.');
    }
}

function editCardCode(message, oldCode, newCode) {
    // Check if user has "Head Admins" role
    if (!message.member.roles.cache.some(role => role.name === "head admin")) {
        message.reply('Only Head Admins can use this command!');
        return;
    }

    // Validate inputs
    if (!oldCode || !newCode) {
        message.reply('Usage: .editcardcode <oldCode> <newCode>');
        return;
    }

    // Find and edit the card code
    var metadata = JSON.parse(fs.readFileSync('./cards/metadata.json', 'utf8'));
    const cardIndex = metadata.findIndex(card => card.code === oldCode);
    if (cardIndex !== -1) {
        metadata[cardIndex].code = newCode;
        metadata[cardIndex].image = `./cards/${newCode}.png`;
        fs.writeFileSync('./cards/metadata.json', JSON.stringify(metadata, null, 2));
        message.reply(`Card code has been changed from ${oldCode} to ${newCode}.`);
        // Rename the file
        fs.rename(`./cards/${oldCode}.png`, `./cards/${newCode}.png`, (err) => {
            if (err) {
                message.reply('Failed to rename the card image.');
            }
        });
        // rename the code for users inventory
        const userFiles = fs.readdirSync('./inventory');
        userFiles.forEach(file => {
            const userData = JSON.parse(fs.readFileSync(`./inventory/${file}`, 'utf8'));
            const cardIndex = userData.cards.findIndex(card => card.code === oldCode);
            if (cardIndex !== -1) {
                userData.cards[cardIndex].code = newCode;
                fs.writeFileSync(`./inventory/${file}`, JSON.stringify(userData, null, 2));
            }
        });
    } else {
        message.reply('Card code not found.');
    }
}

export{
    uploadCard,
    deleteCard,
    editCardCode,
};