<script lang="ts">
	import { SlidersHorizontal, Users } from 'lucide-svelte';

	import * as Tabs from '$lib/components/ui/tabs';
	import UserTable from '$lib/components/UserTable.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
</script>

<svelte:head>
	<title>User Management - Busser</title>
</svelte:head>
<Tabs.Root value="users" class="w-full">
	<Tabs.List class="grid w-full grid-cols-2 mb-4">
		<Tabs.Trigger
			value="general"
			class="flex items-center gap-2"
			onclick={() => (window.location.href = '/settings')}
		>
			<SlidersHorizontal class="w-4 h-4" />General
		</Tabs.Trigger>
		<Tabs.Trigger value="users" class="flex items-center gap-2">
			<Users class="w-4 h-4" />Users
		</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="users">
		<div class="text-sm text-muted-foreground">
			<h4 class="text-xl font-extrabold mb-4 flex flex-row justify-between">User Management</h4>
			<div class="flex justify-left items-center">
				<UserTable users={data.users} currentUser={data.user}></UserTable>
			</div>
		</div>
	</Tabs.Content>
</Tabs.Root>
