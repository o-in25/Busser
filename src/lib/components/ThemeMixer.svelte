<script lang="ts">
	import { Toggle } from 'flowbite-svelte';
	import { themeStore } from '../../stores';

	let currentTheme = '';
	themeStore.subscribe(value => (currentTheme = value));

	const toggleTheme = async ({ target }) => {
		const targetEl = target as HTMLElement;
		const isDark =
			targetEl.ownerDocument.documentElement.classList.toggle('dark');
		if (targetEl.ownerDocument === document)
			// we are NOT in the iFrame
			currentTheme = isDark ? 'dark' : 'light';
		themeStore.set(currentTheme);
		localStorage.setItem('color-theme', currentTheme);
	};
</script>


<Toggle
	on:change={event => toggleTheme(event)}
	checked={currentTheme === 'dark'}
>
	Dark Mode
</Toggle>
