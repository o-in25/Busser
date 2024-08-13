<script lang="ts">
    import { Button, ButtonGroup, Heading, Input, InputAddon, Label, Select } from 'flowbite-svelte';
    import type { PageData } from './$types';
	import Calculator from '$lib/components/Calculator.svelte';
    
    export let data: PageData;


</script>


<div class="mt-5">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between">
    Tools
  </Heading>
</div>
<div class="px-4 py-2 md:py-4">
  <Calculator/>
</div>