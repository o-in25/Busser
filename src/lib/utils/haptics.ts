function vibrate(pattern: number | number[]) {
	if (typeof navigator !== 'undefined' && navigator.vibrate) {
		navigator.vibrate(pattern);
	}
}

export const haptics = {
	light: () => vibrate(10),
	medium: () => vibrate(20),
	success: () => vibrate([10, 50, 10]),
};
