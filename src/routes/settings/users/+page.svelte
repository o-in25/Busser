<script lang="ts">
	import type { PageData } from './$types';
	import UserTable from '$lib/components/UserTable.svelte';
	import type { User } from '$lib/types/auth';

	export let data: PageData;
	let currentUser = data?.user || ({} as User);
</script>

<svelte:head>
	<title>Users - Busser</title>
</svelte:head>
<div class="text-sm text-muted-foreground">
	<h4 class="text-xl font-extrabold mb-4 flex flex-row justify-between">
		User Management
	</h4>
</div>
<UserTable
	users={data?.args}
	{currentUser}
></UserTable>
