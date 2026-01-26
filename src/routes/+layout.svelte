<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';
	import Notification from '$lib/components/Notification.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { setContext } from 'svelte';
	import logo from '$lib/assets/logo.png';
    import Footer from '$lib/components/Footer.svelte';

	export let data: LayoutData;

	// Auth routes where we don't show the navbar
	const authRoutes = ['/login', '/logout', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/workspace-selector'];

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

	const isAuthRoute = (pathname: string) => {
		return authRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
	};

	$: activeUrl = getActiveUrl($page.url.pathname);
	$: user = data.user;
	$: showNav = user && !isAuthRoute($page.url.pathname);

	$: {
		setContext(
			'permissions',
			user?.permissions.map(({ permissionName }) => permissionName) || []
		);
		setContext('roles', user?.roles.map(({ roleName }) => roleName) || []);
	}
</script>

<!-- top nav (only show when logged in and not on auth routes) -->
{#if showNav}
	<Nav {activeUrl} {user} />
{/if}

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
<Footer/>
