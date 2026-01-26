<script lang="ts">
	import type { PageData } from './$types';
	import CategoryForm from '$lib/components/CategoryForm.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Edit {data.category.categoryName} - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-2xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<a href="/inventory" class={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">Edit Category</h1>
			<p class="text-muted-foreground">Update {data.category.categoryName}</p>
		</div>
	</div>

	<CategoryForm category={data.category} />
</div>
