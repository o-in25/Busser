<script lang="ts">
    import { A, Alert, Heading } from 'flowbite-svelte';
    import { AdjustmentsVerticalSolid, InfoCircleSolid, UsersOutline } from 'flowbite-svelte-icons';
    import type { ActionData, PageData } from './$types';
    import ResetPasswordForm from '$lib/components/ResetPasswordForm.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    
    export let form: ActionData;
</script>


<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Add To Inventory"></BreadcrumbItem>
</Breadcrumb>
<div class="px-4 pb-4 mt-3 flex justify-left items-center">
  <div class="grow">
  {#if form?.error || form?.success}
    <Alert border color="{form.error? 'red' : 'green'}" class="mb-4">
      <InfoCircleSolid slot="icon" class="w-5 h-5" />
      {form.error? form.error.message : form.success.message}
    </Alert>
    {/if}
    <ResetPasswordForm></ResetPasswordForm>
  </div>
</div>