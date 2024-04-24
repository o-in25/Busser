<script lang="ts">
	import {
		Heading,
		Breadcrumb,
		BreadcrumbItem,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Button,
	} from 'flowbite-svelte';
	import type { PageData } from './$types';
	import type { User } from '$lib/types/user';
	import {
		DotsVerticalOutline,
		UserRemoveOutline,
		UserEditOutline,
		PlusOutline,
	} from 'flowbite-svelte-icons';
	import {
		BottomNav,
		BottomNavItem,
		Navbar,
		NavBrand,
		NavHamburger,
		NavUl,
		NavLi,
		Dropdown,
		DropdownItem,
	} from 'flowbite-svelte';
	export let data: PageData;
</script>

<Breadcrumb class="mb-4">
	<BreadcrumbItem
		href="/"
		home>Home</BreadcrumbItem
	>
	<BreadcrumbItem href="/">Settings</BreadcrumbItem>
	<BreadcrumbItem>User Management</BreadcrumbItem>
</Breadcrumb>
<Heading
	tag="h2"
	class="mb-4 flex flex-row justify-between"
>
	User Management
	<Button
		size="xs"
		class="items-center flex gap-4"
	>
		<PlusOutline />Add User</Button
	>
</Heading>

<Table>
	<TableHead>
		<TableHeadCell>User ID</TableHeadCell>
		<TableHeadCell>Username</TableHeadCell>
		<TableHeadCell>
			<span class="sr-only">Edit</span>
		</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#each data.users as user}
			<TableBodyRow>
				<TableBodyCell>{user.userId}</TableBodyCell>
				<TableBodyCell>{user.username}</TableBodyCell>
				<TableBodyCell>
					<button
						type="button"
						class="font-medium text-primary-600 hover:underline dark:text-primary-500"
						id="drop"
					>
						<DotsVerticalOutline></DotsVerticalOutline>
					</button>
					<Dropdown
						placement="right-end"
						triggeredBy="#drop"
					>
						<DropdownItem class="items-center flex gap-4">
							<UserEditOutline />Edit User
						</DropdownItem>
						<DropdownItem
							class="text-red-700 dark:text-red-500 items-center flex gap-4"
						>
							<UserRemoveOutline></UserRemoveOutline>Delete User
						</DropdownItem>
					</Dropdown>
				</TableBodyCell>
			</TableBodyRow>
		{/each}
	</TableBody>
</Table>
