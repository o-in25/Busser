<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';
	import { Footer, FooterCopyright } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';
	import Notification from '$lib/components/Notification.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import { setContext } from 'svelte';

	export let data: LayoutData;

	const getActiveUrl = (url: string) => {
		const routes = {
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
<Nav
	{activeUrl}
	{user}
></Nav>

<!-- loading bar -->
<ProgressBar class="text-primary-600" />

<!-- page -->
<div class="container mx-auto p-4">
	<slot />
</div>

<!-- toast -->
<div
	id=""
	class="fixed flex items-center w-full"
	role="alert"
>
	<Notification />
</div>

<!-- footer -->
<div class="mt-auto text-center"> 
	<Footer
		footerType="logo"
		class="rounded-none"
	>
		<hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
		<FooterCopyright by="Busser" />
	</Footer>
</div>
