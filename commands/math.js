/**
 * math.js
 * Safely evaluate simple arithmetic expressions.
 */

export async function math(message, args) {
  // If no arguments were provided
  if (!args || args.length === 0) {
    return message.reply('Please provide a math equation to calculate, e.g. `.math 2+2*3`');
  }

  // Build the expression string and strip whitespace
  const expr = args.join('').replace(/\s+/g, '');

  // Only allow digits, decimal points, parentheses and the four basic operators
  if (!/^[0-9+\-*/().]+$/.test(expr)) {
    return message.reply('Invalid characters detected. Use only numbers and operators (+, -, *, /, parentheses).');
  }

  try {
    // Use the Function constructor to evaluate, then check for finite result
    const result = new Function(`return ${expr}`)();
    if (!isFinite(result)) {
      return message.reply('Math error: division by zero or overflow.');
    }

    await message.reply(`🧮 \`${expr}\` = **${result}**`);
  } catch (err) {
    // Catch parse errors, etc.
    await message.reply('Could not evaluate that expression. Please check your syntax.');
  }
}
