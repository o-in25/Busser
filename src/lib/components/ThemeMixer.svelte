<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { themeStore } from '../../stores';
	import { Sun, Moon } from 'lucide-svelte';

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

<div class="flex items-center gap-3">
	<Sun class="h-4 w-4 text-amber-500" />
	<Switch
		checked={currentTheme === 'dark'}
		onCheckedChange={toggleTheme}
	/>
	<Moon class="h-4 w-4 text-blue-400" />
</div>
