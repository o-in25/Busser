<script lang="ts">
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Info } from 'lucide-svelte';
	import type { ActionData, PageData } from './$types';
	import ResetPasswordForm from '$lib/components/ResetPasswordForm.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { page } from '$app/state';
	import { getContext } from 'svelte';
	export let form: ActionData;
	export let data: PageData;
	const permissions: string[] = getContext('permissions');
	const { userId } = page.params;
</script>

<svelte:head>
	<title>Reset Password - Busser</title>
</svelte:head>
<Breadcrumb
	name="Users"
	href="/settings/users"
>
	<BreadcrumbItem
		name="Edit User"
		href="/settings/users/{userId}/edit"
	></BreadcrumbItem>
	<BreadcrumbItem name="Reset Password"></BreadcrumbItem>
</Breadcrumb>
<div class="px-4 pb-4 mt-3 flex justify-left items-center">
	<div class="grow">
		{#if form?.error || form?.success}
			<Alert
				variant={form.error ? 'destructive' : 'default'}
				class="mb-4 {form.error ? '' : 'border-green-500 text-green-700 dark:text-green-400'}"
			>
				<Info class="w-5 h-5" />
				<AlertDescription>
					{form.error ? form.error.message : form.success.message}
				</AlertDescription>
			</Alert>
		{/if}
		<ResetPasswordForm></ResetPasswordForm>
	</div>
</div>
