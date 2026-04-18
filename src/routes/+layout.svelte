<script lang="ts">
	import '../app.css';


	import { onMount, setContext } from 'svelte';

	import { page } from '$app/stores';
	import { derived } from 'svelte/store';

	const canonical = derived(page, ($page) => `https://busserapp.com${$page.url.pathname}`);
	import { toast } from 'svelte-sonner';

	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { refresh } from '$lib/actions/refresh';

	import { notificationStore } from '../stores';

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
		'/workspace/select',
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
	let keyboardOpen = false;
	onMount(() => {
		const mql = window.matchMedia('(max-width: 767px)');
		isMobile = mql.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mql.addEventListener('change', handler);

		// dismiss keyboard on scroll, but ignore viewport shifts from keyboard opening
		let focusedAt = 0;
		function handleFocusIn() {
			focusedAt = Date.now();
		}
		function handleScroll() {
			if (Date.now() - focusedAt < 500) return;
			const el = document.activeElement;
			if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
				(el as HTMLElement).blur();
			}
		}
		window.addEventListener('focusin', handleFocusIn, { passive: true });
		window.addEventListener('scroll', handleScroll, { passive: true });

		// detect ios keyboard open/close via visualViewport
		const initialHeight = window.visualViewport?.height ?? window.innerHeight;
		let lastVpHeight = initialHeight;
		function handleViewportResize() {
			const vp = window.visualViewport;
			if (!vp) return;

			// only treat viewport shrink as keyboard open when an input is focused
			const el = document.activeElement;
			const inputFocused = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
			keyboardOpen = inputFocused ? vp.height < initialHeight - 100 : false;

			// keyboard dismissed (viewport grew back) — blur the active input
			const grew = vp.height > lastVpHeight + 50;
			lastVpHeight = vp.height;
			if (grew && inputFocused) {
				(el as HTMLElement).blur();
			}
		}
		window.visualViewport?.addEventListener('resize', handleViewportResize);

		return () => {
			mql.removeEventListener('change', handler);
			window.removeEventListener('focusin', handleFocusIn);
			window.removeEventListener('scroll', handleScroll);
			window.visualViewport?.removeEventListener('resize', handleViewportResize);
		};
	});

	$: activeUrl = getActiveUrl($page.url.pathname);
	$: user = data.user;
	$: workspaceName = data.workspaceName;
	$: workspaces = data.workspaces || [];
	$: activeWorkspaceId = data.activeWorkspaceId || null;
	$: showNav = !isAuthRoute($page.url.pathname);

	$: {
		setContext('permissions', user?.permissions.map(({ permissionName }) => permissionName) || []);
		setContext('roles', user?.roles.map(({ roleName }) => roleName) || []);
	}

	// bridge notificationStore to sonner toasts
	$: if ($notificationStore.success?.message) {
		toast.success($notificationStore.success.message);
		$notificationStore.success = null;
	}
	$: if ($notificationStore.error?.message) {
		toast.error($notificationStore.error.message);
		$notificationStore.error = null;
	}
</script>

<svelte:head>
	<link rel="canonical" href={$canonical} />
</svelte:head>

<div class="flex flex-col min-h-screen" style:padding-top={showNav ? undefined : 'env(safe-area-inset-top, 0px)'} use:refresh>
	<!-- nav (only show when logged in and not on auth routes) -->
	{#if showNav}
		<Nav {activeUrl} {user} {workspaceName} {workspaces} {activeWorkspaceId} {keyboardOpen} />
	{/if}

	<!-- page content with bottom padding on mobile for fixed nav -->
	<div class="container mx-auto px-2 py-3 md:px-4 md:py-4 {showNav ? 'pb-24 md:pb-4' : ''}">
		<slot />
	</div>

	<!-- toast -->
	<Toaster position={isMobile ? 'top-center' : 'top-right'} closeButton />

	<!-- footer (hidden on mobile when nav shown, since bottom nav takes that space) -->
	<div class="mt-auto {showNav ? 'hidden md:block' : ''}">
		<Footer />
	</div>
</div>
