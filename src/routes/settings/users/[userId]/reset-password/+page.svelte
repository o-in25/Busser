<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import BackButton from '$lib/components/BackButton.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import ResetPasswordForm from '$lib/components/ResetPasswordForm.svelte';

	import type { ActionData, PageData } from './$types';
	export let form: ActionData;
	export let data: PageData;
	const { userId } = page.params;

	$effect(() => {
		if (form?.error) toast.error(form.error.message);
		if (form?.success) toast.success(form.success.message);
	});
</script>

<svelte:head>
	<title>Reset Password - Busser</title>
</svelte:head>
<Breadcrumb name="Users" href="/settings/users">
	<BreadcrumbItem name="Edit User" href="/settings/users/{userId}/edit"></BreadcrumbItem>
	<BreadcrumbItem name="Reset Password"></BreadcrumbItem>
</Breadcrumb>
<div class="px-4 pb-4 mt-3">
	<div class="flex justify-end mb-4">
		<BackButton fallback="/settings/users/{userId}" label="Back" variant="outline" size="sm" />
	</div>
	<div class="grow">
		<ResetPasswordForm canForceReset={data.canForceReset}></ResetPasswordForm>
	</div>
</div>
