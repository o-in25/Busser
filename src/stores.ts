import { type Writable, writable } from 'svelte/store';

import type { Notification } from '$lib/types';
export const user: Writable<User | null> = writable<User | null>(null);
import { browser } from '$app/environment';
import type { User } from '$lib/types/auth';

//color-theme
export const themeStore = writable<string>(
	(browser && localStorage.getItem('color-theme')) || 'dark'
);

const notification = () => {
	if (!browser || !localStorage) return {};
	let storage = localStorage.getItem('notification') || '{}';
	let json = JSON.parse(storage);
	return json;
};
export const notificationStore = writable<Notification>(notification());

// export const notificationStore = writable({
//   message: 'This is from a store'
// })
