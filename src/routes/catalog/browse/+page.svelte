<script lang="ts">
    import FancyButton from '$lib/components/FancyButton.svelte';
import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<FancyButton href="/catalog/add">Add New</FancyButton>