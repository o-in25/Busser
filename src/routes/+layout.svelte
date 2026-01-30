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
	import { createAvatar } from '@dicebear/core';
	import { shapes } from '@dicebear/collection';
	import { v4 as uuid } from 'uuid';
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
			tools: '/tools',
			settings: '/settings',
		};

		const activeUrl = url.split('/').slice(1).shift() || 'home';
		return routes[activeUrl];
	};

	const isAuthRoute = (pathname: string) => {
		return authRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
	};

	let randomSeed = uuid(); // browser-safe

	type HexColor = string;

	const PRIMARY: HexColor[] = [
		'fff1f4',
		'ffe4e9',
		'ffccd8',
		'ffa2b9',
		'fd6f94',
		'f84e80',
		'e5195f',
		'c10f50',
		'a20f4a',
		'8a1145',
		'4d0421',
	];

	const SECONDARY: HexColor[] = [
		'f8f6fc',
		'f2edfa',
		'e6dff5',
		'd3c4ee',
		'bca3e2',
		'a57dd5',
		'9058c4',
		'844eb3',
		'6f4196',
		'5c377b',
		'3a2253',
	];

	const COLORS = [...PRIMARY, ...SECONDARY];

	const SHAPE_TYPES = [
		'rectangle',
		'rectangleFilled',
		'ellipseFilled',
		'ellipse',
		'polygonFilled',
		'polygon',
		'line',
	] as const;

	const rand = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

	const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

	export function generateRandomShapeAvatar(seed = randomSeed) {
		return createAvatar(shapes, {
			seed,
			size: 128,

			backgroundColor: [rand(COLORS), rand(COLORS)],
			backgroundType: ['gradientLinear'],
			backgroundRotation: [randInt(0, 360)],

			/* Shape 1 */
			shape1: [rand(SHAPE_TYPES)],
			shape1Color: [rand(COLORS), rand(COLORS)],
			shape1OffsetX: [randInt(-65, 65)],
			shape1OffsetY: [randInt(-45, 45)],
			shape1Rotation: [randInt(-160, 160)],

			/* Shape 2 */
			shape2: [rand(SHAPE_TYPES)],
			shape2Color: [rand(COLORS), rand(COLORS)],
			shape2OffsetX: [randInt(-40, 40)],
			shape2OffsetY: [randInt(-40, 40)],
			shape2Rotation: [randInt(-180, 180)],

			/* Shape 3 */
			shape3: [rand(SHAPE_TYPES)],
			shape3Color: [rand(COLORS), rand(COLORS)],
			shape3OffsetX: [randInt(-25, 25)],
			shape3OffsetY: [randInt(-25, 25)],
			shape3Rotation: [randInt(-180, 180)],
		});
	}

	$: activeUrl = getActiveUrl($page.url.pathname);
	$: user = data.user;
	$: showNav = user && !isAuthRoute($page.url.pathname);

	$: {
		setContext('permissions', user?.permissions.map(({ permissionName }) => permissionName) || []);
		setContext('roles', user?.roles.map(({ roleName }) => roleName) || []);
	}

	let avatarDataUri: string;
	$: avatarDataUri = generateRandomShapeAvatar().toDataUri();
</script>

<!-- top nav (only show when logged in and not on auth routes) -->
{#if showNav}
	<Nav {activeUrl} {user} {avatarDataUri} />
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
<Footer />
