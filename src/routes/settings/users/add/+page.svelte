<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import UserForm from '$lib/components/UserForm.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { enhance, applyAction } from '$app/forms';
	import { goto } from '$app/navigation';
	import { notificationStore } from '../../../../stores';

	export let form: ActionData;
	export let data: PageData;
</script>

<svelte:head>
	<title>Add User - Busser</title>
</svelte:head>
<Breadcrumb
	name="Users"
	href="/settings/users"
>
	<BreadcrumbItem
		name="Add User"
		href="/settings/user/add"
	></BreadcrumbItem>
</Breadcrumb>
<div class="px-4 pb-4 mt-3 flex justify-left items-center">
	<div class="grow">
		<form
			class="space-y-6"
			method="POST"
			action="'/settings/users/add"
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
				action="add"
				roles={data.roles}
			></UserForm>
		</form>
	</div>
</div>
