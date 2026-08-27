<script lang="ts">
	import {
		ArrowRight,
		BookOpen,
		ChevronDown,
		Clock,
		FlaskConical,
		GlassWater,
		Lightbulb,
		RefreshCw,
		Sparkles,
		UtensilsCrossed,
		Wine,
	} from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { cn } from '$lib/utils';
	import { cdnSrc } from '$lib/utils/image';
	import type { RecipeInsightLinks, RecipeInsightsOutput } from '$lib/types/generators';

	let {
		content,
		links = null,
		loading = false,
		cached = false,
		regenerating = false,
		onregenerate,
	}: {
		content: RecipeInsightsOutput | null;
		links?: RecipeInsightLinks | null;
		loading?: boolean;
		cached?: boolean;
		regenerating?: boolean;
		onregenerate?: () => void;
	} = $props();

	// real recipe recommendations: prefer the resolved related recipes (same base spirit,
	// guaranteed to exist), then fold in any AI "similar" names that matched the catalog.
	const recommended = $derived.by(() => {
		const out: { recipeId: number; recipeName: string; imageUrl: string | null }[] = [];
		const seen = new Set<number>();
		for (const r of links?.related ?? []) {
			if (seen.has(r.recipeId)) continue;
			seen.add(r.recipeId);
			out.push(r);
		}
		for (const s of links?.similar ?? []) {
			if (s.recipeId && !seen.has(s.recipeId)) {
				seen.add(s.recipeId);
				out.push({ recipeId: s.recipeId, recipeName: s.name, imageUrl: s.imageUrl });
			}
		}
		return out.slice(0, 8);
	});

	// real category-derived substitutions when available, else the AI's textual suggestions
	const hasRealSubs = $derived((links?.substitutions?.length ?? 0) > 0);
	const variations = $derived(
		links?.variations ?? content?.variations.map((v) => ({ ...v, recipeId: null })) ?? []
	);

	// secondary detail sections start collapsed to keep the panel compact
	let openDetails = $state(false);
</script>

{#if loading}
	<Card.Root class="border-primary/20">
		<Card.Header class="pb-3">
			<Card.Title class="flex items-center gap-2 text-lg">
				<Sparkles class="h-5 w-5 text-primary animate-pulse" />
				Crafting insights…
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<!-- higher-contrast shimmer so it reads as loading, not an empty box -->
			{#each [90, 100, 75] as w}
				<div
					class="h-4 rounded-md bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10 bg-[length:200%_100%] animate-shimmer"
					style="width: {w}%"
				></div>
			{/each}
			<div class="flex gap-2 pt-2">
				{#each [1, 2, 3] as _}
					<div
						class="h-8 w-20 rounded-full bg-gradient-to-r from-primary/10 via-primary/25 to-primary/10 bg-[length:200%_100%] animate-shimmer"
					></div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
{:else if content}
	<!-- one cohesive panel instead of a stack of separate cards -->
	<Card.Root class="overflow-hidden border-primary/20">
		<Card.Header class="pb-4 border-b bg-primary/[0.03]">
			<div class="flex items-center justify-between gap-2">
				<Card.Title class="flex items-center gap-2 text-lg">
					<span class="grid place-items-center h-8 w-8 rounded-lg bg-primary/10">
						<Sparkles class="h-4 w-4 text-primary" />
					</span>
					Cocktail Insights
				</Card.Title>
				{#if cached && onregenerate}
					<Button
						variant="ghost"
						size="sm"
						onclick={onregenerate}
						disabled={regenerating}
						class="text-muted-foreground shrink-0"
					>
						<RefreshCw class="w-4 h-4 mr-1.5 {regenerating ? 'animate-spin' : ''}" />
						{regenerating ? 'Regenerating…' : 'Regenerate'}
					</Button>
				{/if}
			</div>
		</Card.Header>

		<Card.Content class="p-0 divide-y divide-border/60">
			<!-- History -->
			<section class="p-5">
				<h3 class="flex items-center gap-2 text-sm font-semibold mb-2">
					<BookOpen class="h-4 w-4 text-primary" />
					History & Origin
				</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">{content.history}</p>
			</section>

			<!-- Flavor + why it works -->
			<section class="p-5 space-y-3">
				<h3 class="flex items-center gap-2 text-sm font-semibold">
					<Sparkles class="h-4 w-4 text-primary" />
					Flavor Profile
				</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">{content.flavorProfile}</p>
				<div class="rounded-lg bg-primary/5 border border-primary/10 p-3">
					<p class="text-sm">
						<span class="font-medium text-primary">Why it works:</span>
						<span class="text-muted-foreground ml-1">{content.whyItWorks}</span>
					</p>
				</div>
			</section>

			<!-- Pro Tips — numbered, no icon bullets -->
			{#if content.proTips.length}
				<section class="p-5">
					<h3 class="flex items-center gap-2 text-sm font-semibold mb-3">
						<Lightbulb class="h-4 w-4 text-primary" />
						Pro Tips
					</h3>
					<ol class="space-y-3">
						{#each content.proTips as tip, i}
							<li class="flex items-start gap-3">
								<span
									class="grid place-items-center h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold"
								>
									{i + 1}
								</span>
								<span class="text-sm text-muted-foreground leading-relaxed pt-0.5">{tip}</span>
							</li>
						{/each}
					</ol>
				</section>
			{/if}

			<!-- Substitutions — real category-derived products when available -->
			{#if hasRealSubs}
				<section class="p-5">
					<h3 class="flex items-center gap-2 text-sm font-semibold mb-1">
						<RefreshCw class="h-4 w-4 text-primary" />
						Make It Yours
					</h3>
					<p class="text-xs text-muted-foreground mb-3">
						Swap an ingredient for another in the same family.
					</p>
					<div class="space-y-3">
						{#each links?.substitutions ?? [] as sub}
							<div class="rounded-lg bg-muted/30 border p-3">
								<p class="text-sm font-medium mb-2">
									Instead of <span class="text-primary">{sub.ingredient}</span>
								</p>
								<div class="flex flex-wrap gap-1.5">
									{#each sub.options as opt}
										<a
											href="/inventory?productName={encodeURIComponent(opt.productName)}"
											class={cn(
												'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-primary/50 hover:bg-primary/5',
												opt.inStock
													? 'border-neon-green-500/30 bg-neon-green-500/10'
													: 'border-border bg-background'
											)}
										>
											<span
												class={cn(
													'h-1.5 w-1.5 rounded-full',
													opt.inStock ? 'bg-neon-green-500' : 'bg-muted-foreground/40'
												)}
											></span>
											{opt.productName}
										</a>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{:else if content.substitutions.length}
				<section class="p-5">
					<h3 class="flex items-center gap-2 text-sm font-semibold mb-3">
						<RefreshCw class="h-4 w-4 text-primary" />
						Substitutions
					</h3>
					<div class="space-y-3">
						{#each content.substitutions as sub}
							<div class="rounded-lg bg-muted/30 border p-3">
								<div class="flex items-center gap-2 mb-1 flex-wrap">
									<Badge variant="outline" class="text-xs">{sub.ingredient}</Badge>
									<ArrowRight class="h-3 w-3 text-muted-foreground" />
									<Badge variant="secondary" class="text-xs">{sub.substitute}</Badge>
								</div>
								<p class="text-xs text-muted-foreground">{sub.note}</p>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Variations & Riffs — link to the real recipe when it exists in the catalog -->
			{#if variations.length}
				<section class="p-5">
					<h3 class="flex items-center gap-2 text-sm font-semibold mb-3">
						<FlaskConical class="h-4 w-4 text-primary" />
						Variations & Riffs
					</h3>
					<div class="space-y-2">
						{#each variations as v}
							{#if v.recipeId}
								<a
									href="/catalog/{v.recipeId}"
									class="group flex items-start justify-between gap-3 rounded-lg bg-muted/30 border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
								>
									<div>
										<h4 class="text-sm font-medium mb-1 flex items-center gap-1.5">
											{v.name}
											<Badge variant="secondary" class="text-[10px] px-1.5 py-0">In catalog</Badge>
										</h4>
										<p class="text-xs text-muted-foreground">{v.description}</p>
									</div>
									<ArrowRight
										class="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
									/>
								</a>
							{:else}
								<div class="rounded-lg bg-muted/30 border p-3">
									<h4 class="text-sm font-medium mb-1">{v.name}</h4>
									<p class="text-xs text-muted-foreground">{v.description}</p>
								</div>
							{/if}
						{/each}
					</div>
				</section>
			{/if}

			<!-- If you like this, try… — only real recipes you can actually open -->
			{#if recommended.length}
				<section class="p-5">
					<h3 class="flex items-center gap-2 text-sm font-semibold mb-3">
						<Wine class="h-4 w-4 text-primary" />
						If You Like This, Try…
					</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each recommended as rec}
							<a
								href="/catalog/{rec.recipeId}"
								class="group flex items-center gap-3 rounded-lg border p-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
							>
								{#if rec.imageUrl}
									<img
										src={cdnSrc(rec.imageUrl, 96)}
										alt={rec.recipeName}
										loading="lazy"
										class="h-10 w-10 rounded-md object-cover shrink-0"
									/>
								{:else}
									<span class="grid place-items-center h-10 w-10 rounded-md bg-primary/10 shrink-0">
										<Wine class="h-4 w-4 text-primary" />
									</span>
								{/if}
								<span class="text-sm font-medium min-w-0 truncate">{rec.recipeName}</span>
								<ArrowRight
									class="h-4 w-4 text-muted-foreground shrink-0 ml-auto transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
								/>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Serving details — secondary, collapsed by default -->
			<section class="p-5">
				<button
					type="button"
					class="flex w-full items-center justify-between text-left"
					onclick={() => (openDetails = !openDetails)}
				>
					<span class="flex items-center gap-2 text-sm font-semibold">
						<GlassWater class="h-4 w-4 text-primary" />
						Serving & Pairings
					</span>
					<ChevronDown
						class={cn(
							'h-4 w-4 text-muted-foreground transition-transform',
							openDetails && 'rotate-180'
						)}
					/>
				</button>

				{#if openDetails}
					<div class="mt-4 space-y-4">
						<div>
							<h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
								Glassware
							</h4>
							<p class="text-sm text-muted-foreground">{content.glassware}</p>
						</div>
						{#if content.garnish.length}
							<div>
								<h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
									Garnish
								</h4>
								<div class="flex flex-wrap gap-1.5">
									{#each content.garnish as g}
										<Badge variant="outline">{g}</Badge>
									{/each}
								</div>
							</div>
						{/if}
						{#if content.foodPairings.length}
							<div>
								<h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
									<UtensilsCrossed class="inline h-3 w-3 mr-1" />
									Food Pairings
								</h4>
								<div class="flex flex-wrap gap-1.5">
									{#each content.foodPairings as p}
										<Badge variant="secondary">{p}</Badge>
									{/each}
								</div>
							</div>
						{/if}
						<div>
							<h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
								<Clock class="inline h-3 w-3 mr-1" />
								When to Serve
							</h4>
							<p class="text-sm text-muted-foreground">{content.occasion}</p>
						</div>
					</div>
				{/if}
			</section>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root>
		<Card.Content class="pt-6">
			<p class="text-muted-foreground italic text-center py-4">
				No additional information available for this cocktail.
			</p>
		</Card.Content>
	</Card.Root>
{/if}
