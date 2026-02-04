<script lang="ts">
	import '../app.css';

	import { ProgressBar } from '@prgm/sveltekit-progress-bar';
	import { setContext } from 'svelte';

	import { page } from '$app/stores';
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import { Toaster } from '$lib/components/ui/sonner';

	import type { LayoutData } from './$types';

	export let data: LayoutData;

	// Auth routes where we don't show the navbar
	const authRoutes = [
		'/login',
		'/logout',
		'/signup',
		'/verify-email',
		'/forgot-password',
		'/reset-password',
		'/workspace-selector',
	];

	const getActiveUrl = (url: string) => {
		const routes: Record<string, string> = {
			home: '/',
			catalog: '/catalog',
			inventory: '/inventory',
			assistant: '/assistant',
			tools: '/tools',
			settings: '/settings',
		};

		const activeUrl = url.split('/').slice(1).shift() || 'home';
		return routes[activeUrl];
	};

	const isAuthRoute = (pathname: string) => {
		return authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
	};

	$: activeUrl = getActiveUrl($page.url.pathname);
	$: user = data.user;
	$: showNav = user && !isAuthRoute($page.url.pathname);

	$: {
		setContext('permissions', user?.permissions.map(({ permissionName }) => permissionName) || []);
		setContext('roles', user?.roles.map(({ roleName }) => roleName) || []);
	}
</script>

<!-- nav (only show when logged in and not on auth routes) -->
{#if showNav}
	<Nav {activeUrl} {user} />
{/if}

<!-- loading bar -->
<ProgressBar color="#ec4899" zIndex={50} />

<!-- page content with bottom padding on mobile for fixed nav -->
<div class="container mx-auto px-2 py-3 md:px-4 md:py-4 {showNav ? 'pb-24 md:pb-4' : ''}">
	<slot />
</div>

<!-- toast -->
<Notification />
<Toaster position="bottom-right" richColors />

<!-- footer (hidden on mobile when nav shown, since bottom nav takes that space) -->
<div class="{showNav ? 'hidden md:block' : ''}">
	<Footer />
</div>
