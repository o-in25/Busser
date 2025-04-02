import type { Notification } from '$lib/types'
import { writable, type Writable } from 'svelte/store'
export const user: Writable<User | null> = writable<User | null>(null);
import { browser, building, dev, version } from '$app/environment';
import type { User } from '$lib/types/auth';

//color-theme
export const themeStore = writable<string>(browser && localStorage.getItem('color-theme') || 'light');

const notification = () => {
  if(!browser || !localStorage) return {}
  let storage = localStorage.getItem('notification') || '{}';
  let json = JSON.parse(storage);
  return json;
}
export const notificationStore = writable<Notification>(notification());

// export const notificationStore = writable({
//   message: 'This is from a store'
// })