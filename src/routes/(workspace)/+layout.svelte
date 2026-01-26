<script lang="ts">
	import type { LayoutData } from './$types';
	import { setContext } from 'svelte';

	export let data: LayoutData;

	// make workspace context available to all child components
	$: {
		setContext('workspace', data.workspace);
	}
</script>

<slot />
