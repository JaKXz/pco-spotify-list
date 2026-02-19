/**
 * Add (or subtract) months from a date.
 * @param {Date} input
 * @param {number} months
 * @returns {Date}
 */
export function addMonths(input, months) {
	const date = new Date(input);
	date.setDate(1);
	date.setMonth(date.getMonth() + months);
	date.setDate(Math.min(input.getDate(), getDaysInMonth(date.getFullYear(), date.getMonth() + 1)));
	return date;
}

/**
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
function getDaysInMonth(year, month) {
	return new Date(year, month, 0).getDate();
}
