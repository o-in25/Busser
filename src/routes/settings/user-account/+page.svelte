<script lang="ts">
	import type { PageData } from './$types';
	import {
		A,
		DescriptionList,
		Heading,
		List,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
	} from 'flowbite-svelte';
	import { ArrowRightOutline } from 'flowbite-svelte-icons';
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
	<div class="text-sm text-gray-500 dark:text-gray-400">
		<Heading
			tag="h4"
			class="mb-4 flex flex-row justify-between font-extrabold"
		>
			Account
		</Heading>
	</div>
	<A
		aClass="font-medium hover:underline flex items-center"
		href="/settings/users/{data.user?.userId}/edit"
	>
		Edit Account...
		<ArrowRightOutline class="ms-1 h-5 w-5" />
	</A>
</div>
<div class="flex justify-left items-center overflow-x-auto w-full">
	<List
		tag="dl"
		class="text-gray-900 dark:text-white divide-y divide-gray-200  dark:divide-gray-700 w-full"
	>
		<div class="flex flex-col pb-3">
			<DescriptionList
				tag="dt"
				class="mb-1"
			>
				Username
			</DescriptionList>
			<DescriptionList tag="dd">{data.user?.username}</DescriptionList>
		</div>
		<div class="flex flex-col pb-3">
			<DescriptionList
				tag="dt"
				class="mb-1"
			>
				Email address
			</DescriptionList>
			<DescriptionList tag="dd">{data.user?.email}</DescriptionList>
		</div>
		<div class="flex flex-col pb-3">
			<DescriptionList
				tag="dt"
				class="mb-1"
			>
				Roles
			</DescriptionList>
			<DescriptionList tag="dd">{roles.join(', ')}</DescriptionList>
		</div>
		<div class="flex flex-col pb-3">
			<DescriptionList
				tag="dt"
				class="mb-1"
			>
				Permissions
			</DescriptionList>
			<DescriptionList tag="dd">
				<Table>
					<TableHead class="text-center">
						<TableHeadCell class="!text-left">Resource</TableHeadCell>
						<TableHeadCell>Can View</TableHeadCell>
						<TableHeadCell>Can Add</TableHeadCell>
						<TableHeadCell>Can Edit</TableHeadCell>
						<TableHeadCell>Can Delete</TableHeadCell>
					</TableHead>
					<TableBody tableBodyClass="divide-y">
						{#each Object.entries(tableEntry) as [_, grants]}
							<TableBodyRow class="capitalize text-center">
								<TableBodyCell class="!text-left">
									{grants.resource}
								</TableBodyCell>
								<TableBodyCell>{grants.view ? 'Yes' : 'No'}</TableBodyCell>
								<TableBodyCell>{grants.add ? 'Yes' : 'No'}</TableBodyCell>
								<TableBodyCell>{grants.edit ? 'Yes' : 'No'}</TableBodyCell>
								<TableBodyCell>{grants.delete ? 'Yes' : 'No'}</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			</DescriptionList>
		</div>
	</List>
</div>
