function formatNumber(value, money = false) {
    if (typeof value === 'number') {
        const strValue = value.toFixed(2); // Convert to 2 decimal places as a string
        if (!money && strValue.endsWith('.00')) {
            value = strValue.split('.')[0]; // Remove .00
        } else {
            value = strValue.replace('.', ','); // Replace . with ,
        }
        let [integerPart, decimalPart] = value.split(',');

        // Add the thousand separator
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Return the formatted number with a comma as a decimal separator
        if (money) {
            return `${integerPart},${decimalPart}`;
        } else if (decimalPart !== undefined) {
            return `${integerPart},${decimalPart}`;
        }
        return integerPart;
    }
    return value; // Return the original value if not a number
}

module.exports = { formatNumber };