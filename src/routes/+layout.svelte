<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';
	import Notification from '$lib/components/Notification.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { setContext } from 'svelte';

	export let data: LayoutData;

	const getActiveUrl = (url: string) => {
		const routes: Record<string, string> = {
			home: '/',
			catalog: '/catalog',
			inventory: '/inventory',
			tools: '/tools',
			settings: '/settings'
		};

		const activeUrl = url.split('/').slice(1).shift() || 'home';
		return routes[activeUrl];
	};

	$: activeUrl = getActiveUrl($page.url.pathname);
	$: user = data.user;

	$: {
		setContext(
			'permissions',
			user?.permissions.map(({ permissionName }) => permissionName) || []
		);
		setContext('roles', user?.roles.map(({ roleName }) => roleName) || []);
	}
</script>

<!-- top nav -->
<Nav {activeUrl} {user} />

<!-- loading bar -->
<ProgressBar color="#ec4899" zIndex={50} />

<!-- page -->
<div class="container mx-auto p-4">
	<slot />
</div>

<!-- toast -->
<Notification />
<Toaster position="bottom-right" richColors />

<!-- footer -->
<footer class="mt-auto glass-nav border-t border-b-0 rounded-none">
	<div class="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-center">
		<hr class="my-6 border-zinc-200/30 sm:mx-auto dark:border-zinc-700/30 lg:my-8 hidden" />
		<span class="text-sm text-muted-foreground">
			&copy; {new Date().getFullYear()} Busser. All rights reserved.
		</span>
	</div>
</footer>
