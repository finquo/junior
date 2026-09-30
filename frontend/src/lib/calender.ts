export function getToday() {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

export function getTomorrow(targetDay = 1) {
	const d = new Date();
	d.setDate(d.getDate() + targetDay);
	d.setHours(0, 0, 0, 0);
	return d;
}

export function getNextDayOfWeek(targetDay: number) {
	const d = new Date();
	const currentDay = d.getDay();
	const diff = (targetDay - currentDay + 7) % 7;
	d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
	d.setHours(0, 0, 0, 0);
	return d;
}
