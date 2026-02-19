<script lang="ts">
	import { ExternalLink } from 'lucide-svelte';

	import type { SpiritSource } from '$lib/types';

	let { sources }: { sources: SpiritSource[] } = $props();
</script>

<section class="mb-12 border-t border-border/30 pt-8">
	<div class="glass-surface p-5">
		<h3 class="text-sm font-semibold text-muted-foreground mb-3">Sources & References</h3>
		<ol class="list-decimal list-inside space-y-1.5">
			{#each sources as source, i}
				<li class="text-sm text-muted-foreground">
					<a
						href={source.url}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-foreground underline underline-offset-2 transition-colors inline-flex items-center gap-1"
					>
						{source.title}
						<ExternalLink class="h-3 w-3" />
					</a>
					<span class="text-muted-foreground/50">· accessed {source.accessedDate}</span>
				</li>
			{/each}
		</ol>
	</div>
</section>
