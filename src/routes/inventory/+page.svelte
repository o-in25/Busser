<script lang="ts">
  import { ButtonGroup, GradientButton, Heading } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import type { PaginationResult, Product } from '$lib/types';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import InventoryTable from '$lib/components/InventoryTable.svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
  
  export let data: PageData;
  export let result: PaginationResult<Product[]> = data.args;
  $: {
    result.data = data.args.data
    result.pagination = data.args.pagination
  }



  // onMount(() => {
  //   const params = new URLSearchParams($page.url.searchParams);
  //   console.log(params)
  //   if (!params.has('page')) {
  //     params.set('page', '1');
  //     goto(`/inventory?${params.toString()}`, { replaceState: true });
  //   }
  // });

  
  const handleSubmit = (data) => {
    // const foo = $page.url.searchParams.get('productName');

    // console.log(foo)
    // // console.log('handled')
    // // console.log($page.url.searchParams)
    // goto(`?${$page.url.searchParams.toString()}`);
  }
  // async function handleSubmit(event: SubmitEvent) {
  //   event.preventDefault(); // Prevent default form submission

  //   const params = new URLSearchParams(window.location.search);
  //   const productName = $page.url.searchParams.get('productName');
  //   if(!productName) console.log('em,pty')
  //   // if (search.trim()) {
  //   //   params.set("productName", search);
  //   // } else {
  //   //   params.delete("productName"); // Remove empty param
  //   // }

  //   await goto(`/inventory?${params.toString()}`, { replaceState: true });
  // }
  
</script>
<div class="mt-5">
  <Heading tag="h2" class="mb-4 flex flex-row justify-between font-extrabold">
    Inventory
  </Heading>
</div>
<div class="px-4 py-2 md:py-4">
  <InventoryTable products={result.data} paginationData={result.pagination}></InventoryTable>
</div>

<style lang="scss">

</style>