<script lang="ts">
	import ThemeMixer from "$lib/components/ThemeMixer.svelte";
</script>

<svelte:head>
	<title>Settings - Busser</title>
</svelte:head>
<div class="text-sm text-muted-foreground">
	<h4 class="text-xl font-extrabold mb-4 flex flex-row justify-between">
		General
	</h4>
</div>
<div class="flex justify-left items-center">
	<ThemeMixer></ThemeMixer>
</div>
