<script lang="ts">
	import '../app.css';

	import { ProgressBar } from '@prgm/sveltekit-progress-bar';
	import { onMount, setContext } from 'svelte';

	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { pullToRefresh } from '$lib/pull-to-refresh';
	import { swipeNav } from '$lib/swipe-nav';

	import type { LayoutData } from './$types';

	export let data: LayoutData;

	// route order for directional transitions (lower index = further "left")
	const routeOrder: Record<string, number> = {
		'/': 0,
		'/inventory': 1,
		'/catalog': 2,
		'/assistant': 3,
		'/tools': 4,
		'/settings': 5,
	};

	function getRouteKey(pathname: string): string {
		// match top-level route segment (e.g. /catalog/123 -> /catalog)
		const match = pathname.match(/^\/[^/]*/);
		return match?.[0] || '/';
	}

	// directional view transitions
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		let direction = 'forward';

		if (navigation.type === 'popstate') {
			direction = 'back';
		} else {
			const fromKey = getRouteKey($page.url.pathname);
			const toKey = getRouteKey(navigation.to?.url.pathname ?? '/');
			const fromIndex = routeOrder[fromKey] ?? -1;
			const toIndex = routeOrder[toKey] ?? -1;

			if (fromIndex !== -1 && toIndex !== -1) {
				direction = toIndex >= fromIndex ? 'forward' : 'back';
			}
		}

		document.documentElement.setAttribute('data-nav-direction', direction);

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

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

	let isMobile = false;
	onMount(() => {
		const mql = window.matchMedia('(max-width: 767px)');
		isMobile = mql.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mql.addEventListener('change', handler);
		return () => mql.removeEventListener('change', handler);
	});

	$: activeUrl = getActiveUrl($page.url.pathname);
	$: user = data.user;
	$: workspaceName = data.workspaceName;
	$: showNav = user && !isAuthRoute($page.url.pathname);

	$: {
		setContext('permissions', user?.permissions.map(({ permissionName }) => permissionName) || []);
		setContext('roles', user?.roles.map(({ roleName }) => roleName) || []);
	}
</script>

<div class="flex flex-col min-h-screen">
	<!-- nav (only show when logged in and not on auth routes) -->
	{#if showNav}
		<Nav {activeUrl} {user} {workspaceName} />
	{/if}

	<!-- loading bar -->
	<ProgressBar color="#ec4899" zIndex={50} />

	<!-- page content with bottom padding on mobile for fixed nav -->
	<div class="container mx-auto px-2 py-3 md:px-4 md:py-4 {showNav ? 'pb-24 md:pb-4' : ''}" use:pullToRefresh use:swipeNav={{ currentPath: activeUrl }}>
		<slot />
	</div>

	<!-- toast -->
	<Notification />
	<Toaster position={isMobile ? 'bottom-center' : 'bottom-right'} richColors />

	<!-- footer (hidden on mobile when nav shown, since bottom nav takes that space) -->
	<div class="mt-auto {showNav ? 'hidden md:block' : ''}">
		<Footer />
	</div>
</div>
