<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { cn } from '$lib/utils';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import {
		LogIn,
		ArrowRight,
		Mail,
		Loader2,
	} from 'lucide-svelte';
	export let data: PageData;
	import placeholder from '$lib/assets/placeholder@2x.jpg';
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';

	const { recipes, spirits } = data;
	const permissions: string[] = getContext('permissions');

	const gallery =
		recipes?.map(
			({
				recipeImageUrl,
				recipeName,
				recipeCategoryDescription,
				recipeId,
				recipeCategoryId,
				recipeDescription,
			}) => ({
				src: recipeImageUrl || placeholder,
				alt: recipeName,
				data: {
					recipeCategoryDescription,
					recipeId,
					recipeCategoryId,
					recipeDescription,
				},
			})
		) || [];

	let loading = false;
	const getData = (key: any, val: any) => (val?.data as any)?.[key];
	let sortBy: string | number = 'all';
	$: filter =
		sortBy === 'all'
			? gallery
			: gallery.filter((item: any) => item.data.recipeCategoryId === sortBy);

	const setFilterType = (type: any) => {
		if (type !== sortBy) {
			sortBy = type;
		}
	};

	const hasAny = (sortBy: number) => gallery.filter((item: any) => item.data.recipeCategoryId === sortBy).length < 1;
</script>

<svelte:head>
	<title>Home - Busser</title>
</svelte:head>
{#if !$page.data.user}
	<h1 class="mb-4 pl-2 md:pl-0 text-3xl font-extrabold md:text-5xl lg:text-6xl">
		<div class="text-center md:text-left">
			From Shelf To&nbsp;<span class="text-transparent bg-clip-text bg-gradient-to-r to-yellow-600 from-pink-400">
				Shaker
			</span>
		</div>
	</h1>
	<p class="px-2 mb-4 text-center md:text-left text-muted-foreground">
		Busser finds recipes that match your on-hand ingredients, no guesswork
		needed.
	</p>
{:else}
	<div class="mt-5 mb-4">
		<h2 class="flex flex-row justify-between text-3xl font-extrabold">
			Ready-to-Make Recipes
		</h2>
	</div>
{/if}

{#if !$page.data.user}
	<div class="flex justify-center md:justify-start my-8">
		<div class="flex space-x-px">
			<a
				class={cn(buttonVariants({ size: "lg" }), "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-r-none")}
				href="/login"
			>
				<LogIn class="w-4 h-4" />
				<span class="pl-1">Log In</span>
			</a>
			<a
				id="btn-sign-up"
				class={cn(buttonVariants({ size: "lg" }), "bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-l-none")}
				href="/signup"
			>
				<Mail class="w-4 h-4" />
				<span class="pl-1">Sign Up</span>
			</a>
		</div>
	</div>
	<Separator />
{/if}

<div
	class="flex items-center justify-center pb-4 md:pb-8 flex-wrap gap-3 mb-3 mx-auto"
>
	<Button
		variant={sortBy === 'all' ? 'default' : 'outline'}
		class="rounded-full"
		size="sm"
		onclick={() => setFilterType('all')}
	>
		All
	</Button>
	{#each spirits as spirit}
		<Button
			variant={sortBy === spirit.recipeCategoryId ? 'default' : 'outline'}
			class="rounded-full"
			size="sm"
			onclick={() => setFilterType(spirit.recipeCategoryId)}
			disabled={hasAny(spirit.recipeCategoryId)}
		>
			{spirit.recipeCategoryDescription}
		</Button>
	{/each}
</div>

{#if !loading}
	<div class="grid gap-4 grid-cols-2 md:grid-cols-3 mb-8">
		{#each filter as item}
			<div
				class="relative group flex justify-center items-center"
				in:fade={{ duration: 500 }}
				out:fade={{ duration: 500 }}
			>
				<img
					src={item.src}
					alt={item.alt}
					class="h-full object-cover w-full rounded-lg"
					loading="lazy"
				/>
				<div
					class="absolute inset-0 right-0 bg-black bg-opacity-60 flex justify-center items-center text-center text-white p-4 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
				>
					<div class="text-center">
						<p class="font-bold text-lg">
							{item.alt}
						</p>
						<p class="hidden md:block text-xs mt-2">
							{getData('recipeDescription', item)}
						</p>
						{#if permissions.includes('view_catalog')}
							<div class="flex justify-center">
								<a
									class="mx-auto font-medium hover:underline flex items-center"
									href="/catalog/{getData('recipeId', item)}"
								>
									Open in catalog<ArrowRight class="ms-1 h-5 w-5" />
								</a>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="my-8 text-center">
		<Loader2 class="h-8 w-8 animate-spin mx-auto" />
	</div>
{/if}
