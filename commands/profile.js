// const { registerFont, createCanvas, loadImage } = require('canvas');
const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas');
import path from 'path';
GlobalFonts.registerFromPath(path.join(__dirname, "../assests/NasalizationRg.otf"), 'Nasalization')
const { request } = require('undici');
import fs from 'fs';
const { AttachmentBuilder } = require('discord.js');
var _ = require('lodash');

const lastGeneration = new Map();

async function profile(message) {
    const userId = message.author.id;
    const cacheFileName = `./temp/profile_${userId}.png`;
    const inventory = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 512 });
    const image = await getCachedOrNewImage(userId, inventory, cacheFileName, avatarURL);
    message.channel.send({ files: [image] });
}

async function bio(message, text) {
    const userId = message.author.id;
    const inventory = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    inventory.profile.bio = text;
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(inventory, null, 2));
    message.channel.send("Bio updated!");
}

async function colour(message, part, hex) {
    const userId = message.author.id;
    const inventory = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    // Check if the hex code is valid
    const hexRegex = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;
    if (!hexRegex.test(hex)) {
        return message.channel.send("Invalid hex code! Please provide a valid hex code.");
    }
    switch (part) {
        case "text":
            inventory.profile.text = hex;
            break;
        case "background1":
            inventory.profile.background1 = hex;
            break;
        case "background2":
            inventory.profile.background2 = hex;
            break;
        case "border1":
            inventory.profile.border1 = hex;
            break;
        case "border2":
            inventory.profile.border2 = hex;
            break;
        default:
            return message.channel.send("Invalid part! Use `.colour <text/background1/background2/border1/border2> <hex>` to change the color.");
            break;
    }
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(inventory, null, 2));
    message.channel.send("Colour updated!");
}

async function profileCard(message, cardCode) {
    const userId = message.author.id;
    const inventory = JSON.parse(fs.readFileSync(`./inventory/${userId}.json`, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(`./cards/metadata.json`, 'utf8'));
    const card = metadata.find(c => c.code === cardCode);
    if (!card) {
        return message.channel.send("Card not found!");
    }
    inventory.profile.faviorite = card.code;
    fs.writeFileSync(`./inventory/${userId}.json`, JSON.stringify(inventory, null, 2));
    message.channel.send("Profile card updated!");
}
function hexToRGB(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(x => x + x).join('');
    }
    return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16)
    ];
}

async function getCachedOrNewImage(userId, inventory, cachePath, avatarURL) {
    if (_.isEqual(lastGeneration.get(userId), inventory)) {
        if (fs.existsSync(cachePath)) {
            console.log("Using cached image!");
            return new AttachmentBuilder(cachePath);
        }
    }
    lastGeneration.set(userId, inventory);

    const canvas = createCanvas(5366, 3200);
    const ctx = canvas.getContext('2d');
    ctx.font = '100px Nasalization';
    ctx.fillStyle = inventory.profile.text;
    ctx.textAlign = 'center';
    const background = await loadImage(`./assests/BlankFrame(SolidFrame).png`);
    ctx.drawImage(background, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const background1 = hexToRGB(inventory.profile.background1);
    const background2 = hexToRGB(inventory.profile.background2);
    const border1 = hexToRGB(inventory.profile.border1);
    const border2 = hexToRGB(inventory.profile.border2);

    for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 49 && data[i + 1] === 36 && data[i + 2] === 68) {//#312444
            data[i    ] = background1[0]+50;
            data[i + 1] = background1[1]+50;
            data[i + 2] = background1[2]+50;
            data[i + 3] = 256*0.75;
        }
        if (data[i] === 15 && data[i + 1] === 0 && data[i + 2] === 37) {// #0F0025
            data[i    ] = Math.floor(background2[0]*(i/data.length) + background1[0]*(1-(i/data.length)));
            data[i + 1] = Math.floor(background2[1]*(i/data.length) + background1[1]*(1-(i/data.length)));
            data[i + 2] = Math.floor(background2[2]*(i/data.length) + background1[2]*(1-(i/data.length)));
        }
        if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 255) {// #FF00FF
            data[i    ] = Math.floor(border2[0]*(i/data.length) + border1[0]*(1-(i/data.length)));
            data[i + 1] = Math.floor(border2[1]*(i/data.length) + border1[1]*(1-(i/data.length)));
            data[i + 2] = Math.floor(border2[2]*(i/data.length) + border1[2]*(1-(i/data.length)));
        }
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.fillText(inventory.profile.username, 950, 450);
    var favioriteCard = ""
    if (inventory.profile.faviorite === "") {
        favioriteCard = inventory.cards[0]?.code;
    } else {
        favioriteCard = inventory.profile.faviorite;
    }
    if (favioriteCard !== undefined) {
        var favioriteCardPath = `./cards/${favioriteCard}.png`;
        const favorite = await loadImage(favioriteCardPath);
        ctx.drawImage(favorite, 250, 588);
        const cardCount = inventory.cards.find(card => card.code === favioriteCard).count;
        ctx.fillText(cardCount, 1000, 2530);
    }
    //get profile picture
    const { body } = await request(avatarURL);
	const avatar = await loadImage(await body.arrayBuffer());
    ctx.drawImage(avatar, 1836, 450, 391, 391);

    ctx.font = '50px Nasalization';
    ctx.fillText(inventory.profile.dateJoined, 2550, 500);
    ctx.fillText(`Daily: ${inventory.streak.login}`, 3000, 500);
    ctx.fillText(`syncbank:`, 3460, 475);
    ctx.fillText(inventory.syncbank, 3460, 525);
    ctx.fillText(`Wallet:`, 3920, 475);
    ctx.fillText(inventory.wallet, 3920, 525);
    ctx.fillText(inventory.profile.bio, 3170, 760);

    ctx.font = 'bold italic 80px Nasalization';
    ctx.fillText("HOARDLIST:", 4560, 560);
    ctx.font = '50px Nasalization';
    
    let index = 0;
    for (const card of inventory.hoard.list) {
        ctx.fillText(card, 4560, 650 + index * 50);
        index++;
    }
    
    index = 0;
    for (const card of inventory.cards) {
        // if (card.code.startsWith("LT")) {
            if (index < 8) {
                const cardImage = await loadImage(`./cards/${card.code}.png`);
                // draw the images in a 4x2 grid
                var width, height, x, y;
                if (card.code.startsWith("LT")) {
                    x = 1670 + (index % 4) * 610;
                    y = 1020 + Math.floor(index / 4) * 830;
                } else {
                    x = 1710 + (index % 4) * 610;
                    y = 1000 + Math.floor(index / 4) * 830;
                }
                if (card.code.startsWith("LT")) {
                    width = 700;
                    height = 700;
                } else {
                    width = Math.round(cardImage.width*0.42);
                    height = Math.round(cardImage.height*0.42);
                }

                ctx.drawImage(cardImage, x, y, width, height);
                ctx.fillText(card.count, 1680 + (index % 4) * 610 + 350, 1095 + Math.floor(index / 4) * 830 + 700);
            }
            index++;
        // }
    }


    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(cachePath, buffer);
    return new AttachmentBuilder(cachePath);
}



export{
    profile,
    bio,
    profileCard,
    colour
}