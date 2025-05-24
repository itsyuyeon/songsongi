import { EmbedBuilder } from 'discord.js';
import db from '../db.js';

/**
 * Syncs a user into the HyperSync Grid by inserting them into the database.
 */
export async function start(message) {
  const userId = message.author.id;

  // Check if user exists in database
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (result.rows.length > 0) {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("**You are already online in the HyperSync Grid!**")
          .setDescription("_Your identity has already been synced._")
          .setFooter({ text: "Kindly check #guide to begin!" })
          .setColor("#F9768C")
      ]
    });
  }

  // Insert user into database, including a `reminders` JSONB column
  await db.query(
    `INSERT INTO users
       (id, username, wallet, syncbank, cardpacks, cards, reminders)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      message.author.username,
      2000, // Starting wallet
      0,    // Starting syncbank
      [],   // Empty cardpacks
      [],   // Empty cards
      {     // Initialize all eight reminder slots
        drop:    0,
        claim:   0,
        pd:      0,
        sync:    0,
        login:   0,
        checkin:  0,
        booster: 0,
        staff:   0
      }
    ]
  );

    // then *create* the on-disk inventory file:
  const initial = {
    wallet:    2000,
    syncbank:    0,
    cards:       [],
    cardpacks:   [],
    // if you use reminders in JSON too, you can kick that off here:
    reminders:   {},
    cooldown:    {}
  };
  const invDir = path.resolve('./inventory');
  if (!fs.existsSync(invDir)) fs.mkdirSync(invDir, { recursive: true });
  fs.writeFileSync(
    path.join(invDir, `${userId}.json`),
    JSON.stringify(initial, null, 2)
  );

  return message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("**You are now online in the HyperSync Grid!**")
        .setDescription("_Your identity has been synced and you're now connected to the network._")
        .setFooter({ text: "Kindly check #guide to begin!" })
        .setColor("#F9768C")
    ]
  });
}

/**
 * Checks if a user is already in the database.
 */
export async function hasStarted(userId) {
  const result = await db.query('SELECT 1 FROM users WHERE id = $1', [userId]);
  return result.rows.length > 0;
}

/**
 * Sends a message prompting the user to start syncing if they haven't.
 */
export function notStartedMessage(message) {
  return message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("**You are still offline in the HyperSync Grid!**")
        .setDescription("_Your identity hasn't been synced and you're not connected to the network yet._")
        .setFooter({ text: "Kindly do .start to sync your account!" })
        .setColor("#F9768C")
    ]
  });
}
