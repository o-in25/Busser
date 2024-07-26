import type { User } from '$lib/types'
import { writable, type Writable } from 'svelte/store'
export const user: Writable<User | null> = writable<User | null>(null);
import { browser, building, dev, version } from '$app/environment';

//color-theme
export const themeStore = writable<string>(browser && localStorage.getItem('color-theme') || 'light');