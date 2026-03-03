<script lang="ts">
	import '../app.css';


	import { onMount, setContext } from 'svelte';

	import { onNavigate } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import CatalogBrowseSkeleton from '$lib/components/skeletons/CatalogBrowseSkeleton.svelte';
	import DashboardSkeleton from '$lib/components/skeletons/DashboardSkeleton.svelte';
	import InventorySkeleton from '$lib/components/skeletons/InventorySkeleton.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { refresh } from '$lib/actions/refresh';
	import { swipe } from '$lib/actions/swipe';

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

		// BackButton sets this override before navigation fires
		const override = document.documentElement.dataset.navOverride;
		delete document.documentElement.dataset.navOverride;

		let direction = 'forward';

		if (override) {
			direction = override;
		} else if (navigation.type === 'popstate') {
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

		// dismiss keyboard on scroll
		function handleScroll() {
			const el = document.activeElement;
			if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
				(el as HTMLElement).blur();
			}
		}
		window.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			mql.removeEventListener('change', handler);
			window.removeEventListener('scroll', handleScroll);
		};
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

<div class="flex flex-col min-h-screen" style:padding-top={showNav ? undefined : 'env(safe-area-inset-top, 0px)'} use:refresh>
	<!-- nav (only show when logged in and not on auth routes) -->
	{#if showNav}
		<Nav {activeUrl} {user} {workspaceName} />
	{/if}

	<!-- page content with bottom padding on mobile for fixed nav -->
	<div class="container mx-auto px-2 py-3 md:px-4 md:py-4 {showNav ? 'pb-24 md:pb-4' : ''}" use:swipe={{ currentPath: activeUrl }}>
		{#if $navigating && showNav}
			{@const target = $navigating.to?.url.pathname || ''}
			{#if target === '/' || target === ''}
				<DashboardSkeleton />
			{:else if target.startsWith('/inventory')}
				<InventorySkeleton />
			{:else if target.startsWith('/catalog')}
				<CatalogBrowseSkeleton />
			{:else}
				<slot />
			{/if}
		{:else}
			<slot />
		{/if}
	</div>

	<!-- toast -->
	<Notification />
	<Toaster position={isMobile ? 'bottom-center' : 'bottom-right'} richColors />

	<!-- footer (hidden on mobile when nav shown, since bottom nav takes that space) -->
	<div class="mt-auto {showNav ? 'hidden md:block' : ''}">
		<Footer />
	</div>
</div>
