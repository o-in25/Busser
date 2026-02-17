<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
	import { page } from '$app/stores';

	import AiAssistant from '$lib/components/AiAssistant.svelte';
	import { Badge } from '$lib/components/ui/badge';
</script>

<svelte:head>
	<title>Busser AI - Busser</title>
</svelte:head>

<div class="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] max-w-3xl mx-auto">
	<!-- hero -->
	<div
		class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-secondary/5 border border-primary/10 mb-4 mt-2"
	>
		<div class="relative px-5 py-5 flex items-center gap-4">
			<div
				class="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0"
			>
				<Sparkles class="h-5 w-5 text-white" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="text-xl font-bold">Busser AI</h1>
					<Badge
						variant="secondary"
						class="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5">Beta</Badge
					>
				</div>
				<p class="text-sm text-muted-foreground mt-0.5">
					Describe a cocktail and the assistant will check your inventory, suggest ingredients, and
					add it to your catalog.
				</p>
			</div>
		</div>
	</div>

	<!-- chat container -->
	<div class="glass-panel flex-1 min-h-0 overflow-hidden">
		<AiAssistant userAvatarUrl={$page.data.user?.avatarImageUrl} />
	</div>
</div>
