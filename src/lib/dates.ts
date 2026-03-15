const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
export const MAX_PAST_WINDOW = addMonths(TODAY, -6);
export const MAX_FUTURE_WINDOW = addMonths(TODAY, 3);

function addMonths(input: Date, months: number) {
	const date = new Date(input);
	date.setDate(1);
	date.setMonth(date.getMonth() + months);
	date.setDate(Math.min(input.getDate(), getDaysInMonth(date.getFullYear(), date.getMonth() + 1)));
	return date;
}

function getDaysInMonth(year: number, month: number) {
	return new Date(year, month, 0).getDate();
}
