<script lang="ts">
	import * as Card from '$lib/components/ui/card';
</script>

<svelte:head>
	<title>Privacy Policy - Busser</title>
</svelte:head>

<div class="max-w-3xl mx-auto py-8">
	<Card.Root class="glass-card p-6 md:p-8">
		<h1 class="text-3xl font-bold mb-6">Privacy Policy</h1>

		<div class="prose prose-zinc dark:prose-invert">
			<p class="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

			<h2 class="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
			<p class="text-muted-foreground mb-4">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
			</p>

			<h2 class="text-xl font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
			<p class="text-muted-foreground mb-4">
				Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
			</p>

			<h2 class="text-xl font-semibold mt-6 mb-3">3. Data Security</h2>
			<p class="text-muted-foreground mb-4">
				Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
			</p>

			<h2 class="text-xl font-semibold mt-6 mb-3">4. Third-Party Services</h2>
			<p class="text-muted-foreground mb-4">
				Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.
			</p>

			<h2 class="text-xl font-semibold mt-6 mb-3">5. Your Rights</h2>
			<p class="text-muted-foreground mb-4">
				At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
			</p>

			<h2 class="text-xl font-semibold mt-6 mb-3">6. Contact Us</h2>
			<p class="text-muted-foreground mb-4">
				Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.
			</p>
		</div>
	</Card.Root>
</div>
