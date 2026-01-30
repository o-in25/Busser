<script lang="ts">
	import { setContext } from 'svelte';

	import type { LayoutData } from './$types';

	export let data: LayoutData;

	// make workspace context available to all child components
	$: {
		setContext('workspace', data.workspace);
	}
</script>

<slot />
