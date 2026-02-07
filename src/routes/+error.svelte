<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Home, ArrowLeft } from 'lucide-svelte';

	// Map common status codes to user-friendly titles
	const statusTitles: Record<number, string> = {
		400: 'Bad Request',
		401: 'Unauthorized',
		403: 'Access Denied',
		404: 'Page Not Found',
		500: 'Server Error',
		502: 'Bad Gateway',
		503: 'Service Unavailable',
	};

	// Get the status code (always available)
	const statusCode = $derived($page.status);

	// Get the title - prefer custom reason, fall back to status title, then generic
	const title = $derived(
		$page.error?.reason && $page.error.reason !== 'Error'
			? $page.error.reason
			: statusTitles[statusCode] || 'Something Went Wrong'
	);

	// Get the message - only show if it adds information
	const message = $derived.by(() => {
		const msg = $page.error?.message;
		if (!msg) return null;
		// Don't show message if it's just a repeat of the title or generic
		const lowerMsg = msg.toLowerCase();
		const lowerTitle = title.toLowerCase();
		if (lowerMsg === lowerTitle || lowerMsg === 'error' || lowerMsg === 'internal error') {
			return null;
		}
		return msg;
	});
</script>

<svelte:head>
	<title>{statusCode} {title} - Busser</title>
</svelte:head>

<section class="relative py-6 sm:py-10">
	<div class="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
		<div class="mx-auto max-w-screen-sm text-center">
			<h1 class="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary">
				{statusCode}
			</h1>
			<p class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
				{title}
			</p>
			{#if message}
				<p class="mb-6 text-lg font-light text-muted-foreground">
					{message}
				</p>
			{/if}
			<div class="flex flex-col sm:flex-row gap-3 justify-center mt-8">
				<Button variant="outline" onclick={() => history.back()}>
					<ArrowLeft class="h-4 w-4 mr-2" />
					Go Back
				</Button>
				<Button href="/">
					<Home class="h-4 w-4 mr-2" />
					Go Home
				</Button>
			</div>
		</div>
	</div>
</section>
