<script lang="ts">
	import { setContext } from 'svelte';

	import { page } from '$app/stores';
	import GlobalCatalogAlert from '$lib/components/GlobalCatalogAlert.svelte';

	import type { LayoutData } from './$types';

	export let data: LayoutData;

	$: {
		setContext('workspace', data.workspace);
	}

	$: showGlobalCatalogAlert =
		!!$page.data.user && data.isGlobalWorkspace && data.workspace?.workspaceRole !== 'owner';
</script>

{#if showGlobalCatalogAlert}
	<GlobalCatalogAlert class="mb-6 mt-4" />
{/if}
<slot />
