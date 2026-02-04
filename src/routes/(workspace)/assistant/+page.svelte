<script lang="ts">
	import { page } from '$app/stores';

	import AiAssistant from '$lib/components/AiAssistant.svelte';
	import { Badge } from '$lib/components/ui/badge';
</script>

<svelte:head>
	<title>Busser AI</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<div class="flex items-center gap-2">
			<h1 class="text-2xl font-bold">Busser AI</h1>
			<Badge variant="secondary" class="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5">Beta</Badge>
		</div>
		<p class="text-sm text-muted-foreground mt-1">
			Create recipes using natural language. Describe a cocktail and the assistant will check your
			inventory, suggest ingredients, and add it to your catalog.
		</p>
	</div>

	<div class="rounded-xl border bg-card overflow-hidden">
		<AiAssistant userAvatarUrl={$page.data.user?.avatarImageUrl} />
	</div>
</div>
