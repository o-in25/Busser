
<div class="container mx-auto px-4">
    <slot/>
</div>
<script lang="ts">
    import "../app.css";
    import type { LayoutData } from './$types';
    import { BottomNav, BottomNavItem, Skeleton, ImagePlaceholder } from 'flowbite-svelte';
    import { HomeSolid, WalletSolid, AdjustmentsVerticalOutline, UserCircleSolid } from 'flowbite-svelte-icons';

    export let data: LayoutData;
</script>

<style lang="postcss">

</style>
