<script lang="ts">
	import CategoryForm from '$lib/components/CategoryForm.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
</script>

<svelte:head>
	<title>Add Category - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-2xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<a href="/inventory" class={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">Add New Category</h1>
			<p class="text-muted-foreground">Create a new product category</p>
		</div>
	</div>

	<CategoryForm />
</div>
