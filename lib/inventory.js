// lib/inventory.js
import fs  from 'fs';
import path from 'path';

export function loadInventory(userId) {
  const invDir  = path.resolve('./inventory');
  const invPath = path.join(invDir, `${userId}.json`);

  if (!fs.existsSync(invDir)) {
    fs.mkdirSync(invDir, { recursive: true });
  }

  if (!fs.existsSync(invPath)) {
    const defaults = {
      wallet:    0,
      syncbank:  0,
      cards:     [],
      cardpacks: [],
      reminders: {},
      cooldown:  {}
    };
    fs.writeFileSync(invPath, JSON.stringify(defaults, null, 2));
    return defaults;
  }

  try {
    const raw = fs.readFileSync(invPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`⚠️ Corrupted JSON at ${invPath}, renaming and recreating default:`, err);
    fs.renameSync(invPath, invPath + '.broken');
    const defaults = {
      wallet:    0,
      syncbank:  0,
      cards:     [],
      cardpacks: [],
      reminders: {},
      cooldown:  {}
    };
    fs.writeFileSync(invPath, JSON.stringify(defaults, null, 2));
    return defaults;
  }
}
