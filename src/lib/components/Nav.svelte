<script lang="ts">
	import {
		Navbar,
		NavHamburger,
		NavBrand,
		Dropdown,
		DropdownHeader,
		DropdownItem,
		DropdownDivider,
		NavUl,
		NavLi,
		Drawer,
		CloseButton,
		Sidebar,
		SidebarWrapper,
		SidebarGroup,
		SidebarItem,
	} from 'flowbite-svelte';
	import {
		ArrowRightToBracketOutline,
		ClipboardListOutline,
		GridOutline,
		HomeOutline,
		CogOutline,
		RulerCombinedOutline,
		ArrowLeftToBracketOutline,
	} from 'flowbite-svelte-icons';
	import { sineIn } from 'svelte/easing';
	import { goto, invalidateAll } from '$app/navigation';
	import Placeholder from './Placeholder.svelte';
	import logo from '$lib/assets/logo-nav.png';
	import type { User } from '$lib/types/auth';

	// props
	export let user: User | null;
	export let activeUrl: string;

	async function logout() {
		const response = await fetch('/logout', {
			method: 'POST',
		});
		if (response.ok) {
			await invalidateAll();
			await goto(`/`);
			showDrawer = true;
		}
	}

	$: showDrawer = true;
	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn,
	};
</script>

<!-- desktop only -->
<!-- nav -->
<Navbar
	color="default"
	class="mb-3"
>
	{#if user}
		<NavHamburger
			classMenu="w-full md:flex md:w-auto md:order-1"
			onClick={() => {
				showDrawer = false;
			}}
		/>
	{/if}

	<!-- logo -->
	<div class={!user ? 'm-auto' : ''}>
		<NavBrand href="/">
			<img
				src={logo}
				class="me-3 h-12"
				alt="Flowbite Logo"
			/>
			<span
				class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
			></span>
		</NavBrand>
	</div>
	{#if user}
		<!-- avatar -->
		<div class="flex items-center md:order-2 user-nav">
			<div class="hidden md:block">
				<Placeholder id="avatar-menu" />
			</div>
		</div>
		<!-- dropdown -->
		<Dropdown
			placement="bottom"
			triggeredBy="#avatar-menu"
			classContainer="backdrop-blur-md bg-zinc-200/50 dark:bg-zinc-900/30 border border-zinc-300/30 dark:border-zinc-700/40 shadow-lg rounded-xl p-4"
		>
			<DropdownHeader>
				<span class="block text-sm">{user?.username}</span>
				<span class="block truncate text-sm font-medium">
					{user.email}
				</span>
			</DropdownHeader>
			<DropdownItem
				href="/settings"
				class="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-primary-500/10 focus:bg-primary-500/20 aria-selected:bg-primary-500/20 dark:hover:bg-primary-500/20 dark:focus:bg-primary-500/30 dark:aria-selected:bg-primary-500/30"
			>
				<span class="flex"><CogOutline class="me-2" />Settings</span>
			</DropdownItem>
			<DropdownItem
				href="/tools"
				class="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-primary-500/10 focus:bg-primary-500/20 aria-selected:bg-primary-500/20 dark:hover:bg-primary-500/20 dark:focus:bg-primary-500/30 dark:aria-selected:bg-primary-500/30"
			>
				<span class="flex"><RulerCombinedOutline class="me-2" />Tools</span>
			</DropdownItem>
			<DropdownDivider />
			<DropdownItem
				on:click={logout}
				class="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-primary-500/10 focus:bg-primary-500/20 aria-selected:bg-primary-500/20 dark:hover:bg-primary-500/20 dark:focus:bg-primary-500/30 dark:aria-selected:bg-primary-500/30"
			>
				{#if user}<span class="flex">
						<ArrowRightToBracketOutline class="me-2" />Sign out
					</span>{:else}<span class="flex">
						<ArrowLeftToBracketOutline class="me-2" />Sign In
					</span>{/if}
			</DropdownItem>
		</Dropdown>
	{/if}

	<!-- tabs -->
	{#if user}
		<NavUl
			{activeUrl}
			slideParams={{ delay: 250, duration: 500, easing: sineIn }}
		>
			<NavLi href="/">Home</NavLi>
			<NavLi href="/inventory">Inventory</NavLi>
			<NavLi href="/catalog">Catalog</NavLi>
			<!-- <NavLi href="/tools">Tools</NavLi> -->
		</NavUl>
	{/if}
</Navbar>

<!-- mobile only -->
<Drawer
	transitionType="fly"
	{transitionParams}
	bind:hidden={showDrawer}
	id="sidebar2"
>
	<!-- user profile -->
	<div class="flex items-center">
		<div class="flex">
			<div class="self-center">
				<Placeholder id="avatar-menu-mobile" />
			</div>

			<div class="ml-3">
				<h5 class="text-lg font-medium text-gray-900 dark:text-white">
					{user?.username}
				</h5>
				<span class="text-sm text-gray-500 dark:text-gray-400">
					{user?.email}
				</span>
			</div>
		</div>

		<!-- close -->
		<CloseButton
			on:click={() => (showDrawer = true)}
			class="mb-4 dark:text-white"
		/>
	</div>

	<Sidebar>
		<SidebarWrapper
			divClass="overflow-y-auto py-4 px-3 rounded dark:bg-gray-800"
		>
			<SidebarGroup>
				<SidebarItem
					label="Home"
					href="/"
					on:click={() => (showDrawer = true)}
				>
					<svelte:fragment slot="icon">
						<HomeOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem
					label="Inventory"
					href="/inventory"
					on:click={() => (showDrawer = true)}
				>
					<svelte:fragment slot="icon">
						<ClipboardListOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem
					label="Catalog"
					href="/catalog"
					on:click={() => (showDrawer = true)}
				>
					<svelte:fragment slot="icon">
						<GridOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>

				<hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />

				<SidebarItem
					label="Tools"
					href="/tools"
					on:click={() => (showDrawer = true)}
				>
					<svelte:fragment slot="icon">
						<RulerCombinedOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>

				<SidebarItem
					label="Settings"
					href="/settings"
					on:click={() => (showDrawer = true)}
				>
					<svelte:fragment slot="icon">
						<CogOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>

				<hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />

				<SidebarItem
					label="Sign Out"
					on:click={async () => await logout()}
				>
					<svelte:fragment slot="icon">
						<ArrowRightToBracketOutline
							class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
						/>
					</svelte:fragment>
				</SidebarItem>
			</SidebarGroup>
		</SidebarWrapper>
	</Sidebar>
</Drawer>

<style lang="scss">
	.user-nav {
		width: 40px;
	}
</style>
