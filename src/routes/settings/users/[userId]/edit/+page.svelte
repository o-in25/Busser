<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import UserForm from '$lib/components/UserForm.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { getContext } from 'svelte';
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import { notificationStore } from '../../../../../stores';

	export let form: ActionData;
	export let data: PageData;
	const permissions: string[] = getContext('permissions') || [];
</script>

<svelte:head>
	<title>Edit User - Busser</title>
</svelte:head>
{#if permissions.includes('edit_admin')}
	<Breadcrumb
		name="Users"
		href="/settings/users"
	>
		<BreadcrumbItem name="Edit User"></BreadcrumbItem>
	</Breadcrumb>
{/if}
<div class="px-4 pb-4 mt-3 flex justify-left items-center">
	<div class="grow">
    <form
    class="space-y-6"
    method="POST"
    action={`/settings/users/${data.user?.userId}/edit`}
    use:enhance={() => {
      return async ({ result }) => {
        if (result.type === 'redirect') {
          goto(result.location);
        } else {
          await applyAction(result);
          if (result.type === 'failure')
            $notificationStore.error = {
              message: result?.data?.error?.toString() || '',
            };
          if (result.type === 'success')
            $notificationStore.success = { message: 'User updated.' };
        }
      };
    }}
  >
		<UserForm
			user={data.user}
			action="edit"
			roles={data.roles}
		></UserForm>
    </form>
	</div>
</div>
