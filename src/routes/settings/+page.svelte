<script lang="ts">
	import ThemeMixer from "$lib/components/ThemeMixer.svelte";
	import * as Card from '$lib/components/ui/card';
	import { Settings, Palette, Info } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Settings - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold">General Settings</h1>
		<p class="text-sm text-muted-foreground mt-1">
			Configure your application preferences
		</p>
	</div>

	<!-- Appearance Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Palette class="h-5 w-5" />
				Appearance
			</Card.Title>
			<Card.Description>
				Customize how Busser looks on your device
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
				<div class="space-y-1">
					<p class="font-medium">Theme</p>
					<p class="text-sm text-muted-foreground">
						Switch between light and dark mode
					</p>
				</div>
				<ThemeMixer />
			</div>
		</Card.Content>
	</Card.Root>

	<!-- App Info Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Info class="h-5 w-5" />
				About
			</Card.Title>
			<Card.Description>
				Application information
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="p-4 rounded-lg bg-muted/30">
					<p class="text-sm text-muted-foreground mb-1">Application</p>
					<p class="font-semibold">Busser</p>
				</div>
				<div class="p-4 rounded-lg bg-muted/30">
					<p class="text-sm text-muted-foreground mb-1">Version</p>
					<p class="font-semibold">1.0.0</p>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
