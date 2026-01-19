<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { themeStore } from '../../stores';

	let currentTheme = '';
	themeStore.subscribe(value => (currentTheme = value));

	const toggleTheme = (checked: boolean) => {
		const isDark = checked;
		document.documentElement.classList.toggle('dark', isDark);
		currentTheme = isDark ? 'dark' : 'light';
		themeStore.set(currentTheme);
		localStorage.setItem('color-theme', currentTheme);
	};
</script>

<div class="flex items-center gap-2">
	<Switch
		checked={currentTheme === 'dark'}
		onchange={toggleTheme}
	/>
	<Label>Dark Mode</Label>
</div>
