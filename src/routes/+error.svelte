<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Error - Busser</title>
</svelte:head>
<section class="relative py-6 sm:py-10">
	<div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
		<div class="mx-auto max-w-screen-sm text-center">
			<h1 class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary">
				{$page.error?.code || 'Error'}
			</h1>
			<p class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
				{$page.error?.reason || 'Error'}
			</p>
			<p class="mb-4 text-lg font-light text-muted-foreground">
				{$page.error?.message}
			</p>
		</div>
	</div>
</section>
