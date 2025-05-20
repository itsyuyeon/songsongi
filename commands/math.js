async function math(message, equation) {
    // Check if the user provided an equation
    if (!equation) {
        return message.reply('Please provide a math equation to calculate.');
    }
    // concatinate the equation into a string
    equation = equation.join('');
    // Remove spaces and check for valid characters
    const cleanEquation = equation.replace(/\s+/g, '');
    if (!/^[0-9+\-*/().]+$/.test(cleanEquation)) {
        return message.reply('Please enter a valid math equation using only numbers and basic operators (+, -, *, /)');
    }

    try {
        // Use Function constructor to safely evaluate the math expression
        const result = new Function(`return ${cleanEquation}`)();
        
        if (!isFinite(result)) {
            return message.reply('Error: Invalid calculation (division by zero or too large numbers)');
        }

        await message.reply(`${equation} = ${result}`);
    } catch (error) {
        await message.reply('Error: Invalid math equation');
    }
}

module.exports = {
    math,
};