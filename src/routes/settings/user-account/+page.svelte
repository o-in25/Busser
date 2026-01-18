<script lang="ts">
	import type { PageData } from './$types';
	import * as Table from '$lib/components/ui/table';
	import { ArrowRight } from 'lucide-svelte';
	import { getContext } from 'svelte';

	export let data: PageData;

	const normalizePermissions = (permissions: any[]): any => {
		const validGrants = ['view', 'add', 'edit', 'delete'];

		const result = {};

		permissions.forEach(perm => {
			const [grant, ...resourceParts] = perm.split('_');
			const resource = resourceParts.join('_');

			if (!validGrants.includes(grant)) return;

			if (!result[resource]) {
				result[resource] = {
					view: false,
					add: false,
					edit: false,
					delete: false,
					resource,
				};
			}

			result[resource][grant] = true;
		});

		return result;
	};

	const permissions: string[] = getContext('permissions') || [];
	const roles: string[] = getContext('roles') || [];

	const tableEntry: Record<
		string,
		{
			view: boolean;
			add: boolean;
			edit: boolean;
			delete: boolean;
			resource: string;
		}
	> = normalizePermissions(permissions);
</script>

<svelte:head>
	<title>Account - Busser</title>
</svelte:head>
<div class="flex items-center justify-between gap-4">
	<div class="text-sm text-muted-foreground">
		<h4 class="text-xl font-extrabold mb-4 flex flex-row justify-between">
			Account
		</h4>
	</div>
	<a
		class="font-medium hover:underline flex items-center"
		href="/settings/users/{data.user?.userId}/edit"
	>
		Edit Account...
		<ArrowRight class="ms-1 h-5 w-5" />
	</a>
</div>
<div class="flex justify-left items-center overflow-x-auto w-full">
	<dl class="text-foreground divide-y divide-border w-full">
		<div class="flex flex-col pb-3">
			<dt class="mb-1 text-muted-foreground">
				Username
			</dt>
			<dd>{data.user?.username}</dd>
		</div>
		<div class="flex flex-col pb-3">
			<dt class="mb-1 text-muted-foreground">
				Email address
			</dt>
			<dd>{data.user?.email}</dd>
		</div>
		<div class="flex flex-col pb-3">
			<dt class="mb-1 text-muted-foreground">
				Roles
			</dt>
			<dd>{roles.join(', ')}</dd>
		</div>
		<div class="flex flex-col pb-3">
			<dt class="mb-1 text-muted-foreground">
				Permissions
			</dt>
			<dd>
				<Table.Root>
					<Table.Header>
						<Table.Row class="text-center">
							<Table.Head class="!text-left">Resource</Table.Head>
							<Table.Head>Can View</Table.Head>
							<Table.Head>Can Add</Table.Head>
							<Table.Head>Can Edit</Table.Head>
							<Table.Head>Can Delete</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each Object.entries(tableEntry) as [_, grants]}
							<Table.Row class="capitalize text-center">
								<Table.Cell class="!text-left">
									{grants.resource}
								</Table.Cell>
								<Table.Cell>{grants.view ? 'Yes' : 'No'}</Table.Cell>
								<Table.Cell>{grants.add ? 'Yes' : 'No'}</Table.Cell>
								<Table.Cell>{grants.edit ? 'Yes' : 'No'}</Table.Cell>
								<Table.Cell>{grants.delete ? 'Yes' : 'No'}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</dd>
		</div>
	</dl>
</div>
