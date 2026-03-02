<script lang="ts">
	import { Info } from 'lucide-svelte';

	import { page } from '$app/state';
	import BackButton from '$lib/components/BackButton.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import ResetPasswordForm from '$lib/components/ResetPasswordForm.svelte';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';

	import type { ActionData, PageData } from './$types';
	export let form: ActionData;
	export let data: PageData;
	const { userId } = page.params;
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
		{#if form?.error || form?.success}
			<Alert
				variant={form.error ? 'destructive' : 'default'}
				class="mb-4 {form.error ? '' : 'border-neon-green-500 text-neon-green-700 dark:text-neon-green-400'}"
			>
				<Info class="w-5 h-5" />
				<AlertDescription>
					{form.error ? form.error.message : form.success.message}
				</AlertDescription>
			</Alert>
		{/if}
		<ResetPasswordForm canForceReset={data.canForceReset}></ResetPasswordForm>
	</div>
</div>
