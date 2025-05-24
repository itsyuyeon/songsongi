// commands/shop.js
import fs from "fs";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";

export function shop(message) {
  const shopData = JSON.parse(fs.readFileSync("./shop/shop.json","utf8"));
  let description = "";
  const itemEmotes = {
    BYTE: "<:bytepack:1358092889904906400>",
    CORE: "<:corepack:1358092894224908298>",
    HYPER: "<:hyperpack:1358092898863808604>",
  };

  for (const item of shopData) {
    const emote = itemEmotes[item.code.toUpperCase()]||"";
    description += `${emote} \`${item.code}\` **${item.name}**: ${item.price} credits\n`;
  }

  const embed = new EmbedBuilder()
    .setTitle("Accessing Signal Store...")
    .setColor("#49CA4D")
    .setDescription(description);

  const buttons = new ActionRowBuilder().addComponents(
    shopData.map((item) =>
      new ButtonBuilder()
        .setCustomId(`buy_${item.code}`)
        .setLabel(`${item.name} - ${item.price} credits`)
        .setStyle(ButtonStyle.Primary)
    )
  );

  return message.reply({ embeds: [embed], components: [buttons] });
}

export function addShop(message, name, description, price, code, amount, rarities) {
  if (!message.member.roles.cache.some(r=>r.name==="head admin")) {
    return message.channel.send("Only Head Admins can use this command!");
  }
  if (!name||!description||!price||!code||!amount||!rarities) {
    return message.channel.send(
      "Usage: `.ashop <name> \"<description>\" <price> <code> <amount> <rarities...>`"
    );
  }

  const shopData = JSON.parse(fs.readFileSync("./shop/shop.json","utf8"));
  shopData.push({
    name,
    description,
    price: Number(price),
    code,
    cards: Number(amount),
    rarity: rarities
      .split(" ")
      .reduce((acc,cur)=>{
        const [r,c]=cur.split(":");
        acc[r]=Number(c);
        return acc;
      },{}),
  });

  fs.writeFileSync(
    "./shop/shop.json",
    JSON.stringify(shopData, null, 2)
  );
  message.channel.send(`Added **${name}** to the shop!`);
}

export function removeShop(message, code) {
  if (!message.member.roles.cache.some(r=>r.name==="head admin")) {
    return message.channel.send("Only Head Admins can use this command!");
  }
  if (!code) {
    return message.channel.send("Usage: `.rshop <code>`");
  }

  const shopData = JSON.parse(fs.readFileSync("./shop/shop.json","utf8"));
  const idx = shopData.findIndex(
    item => item.code.toLowerCase() === code.toLowerCase()
  );
  if (idx === -1) {
    return message.channel.send("Item not found in shop!");
  }

  shopData.splice(idx,1);
  fs.writeFileSync(
    "./shop/shop.json",
    JSON.stringify(shopData, null, 2)
  );
  message.channel.send(`Removed item **${code}** from the shop.`);
}
