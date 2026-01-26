<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo-nav.png'
	import type { User } from '$lib/types/auth';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from '$lib/components/ui/sheet';
	import {
		Menu,
		Home,
		ClipboardList,
		LayoutGrid,
		Settings,
		Ruler,
		LogIn,
		LogOut,
		X,
	} from 'lucide-svelte';
	import Placeholder from './Placeholder.svelte';

	// props
	let { user, activeUrl }: { user: User | null; activeUrl: string } = $props();

	// Check if navbar has content (nav links, user menu, etc.)
	let hasNavContent = $derived(!!user);
	let sheetOpen = $state(false);

	async function logout() {
		const response = await fetch('/logout', {
			method: 'POST',
			body: new FormData(),
		});
		if (response.ok) {
			await invalidateAll();
			await goto(`/`);
			sheetOpen = false;
		}
	}

	function isActive(path: string): boolean {
		if (!activeUrl) return false;
		if (path === '/') {
			return activeUrl === '/';
		}
		return activeUrl.startsWith(path);
	}
</script>

<!-- Desktop Navigation -->
<nav class="glass-nav sticky top-0 z-50 w-full px-4 py-3">
	<div class="mx-auto flex max-w-7xl items-center {hasNavContent ? 'justify-center md:justify-between' : 'justify-center'} relative">
		<!-- Mobile Menu Button -->
		{#if user}
			<Sheet.Root bind:open={sheetOpen}>
				<Sheet.Trigger class="absolute left-0 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 md:hidden">
					<Menu class="h-6 w-6" />
					<span class="sr-only">Open menu</span>
				</Sheet.Trigger>

				<Sheet.Content side="left" class="w-80 glass-panel border-r-0">
					<Sheet.Header class="text-left">
						<!-- User Profile in Drawer -->
						<div class="flex items-center gap-3 pb-4">
							<Placeholder id="avatar-menu-mobile" />
							<div>
								<p class="text-lg font-medium text-foreground">
									{user?.username}
								</p>
								<p class="text-sm text-muted-foreground">
									{user?.email}
								</p>
							</div>
						</div>
					</Sheet.Header>

					<Separator class="my-4" />

					<!-- Navigation Links -->
					<nav class="flex flex-col gap-2">
						<a
							href="/"
							onclick={() => (sheetOpen = false)}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground {isActive('/') ? 'bg-primary/10 text-foreground' : ''}"
						>
							<Home class="h-5 w-5" />
							Home
						</a>

						<a
							href="/inventory"
							onclick={() => (sheetOpen = false)}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground {isActive('/inventory') ? 'bg-primary/10 text-foreground' : ''}"
						>
							<ClipboardList class="h-5 w-5" />
							Inventory
						</a>

						<a
							href="/catalog"
							onclick={() => (sheetOpen = false)}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground {isActive('/catalog') ? 'bg-primary/10 text-foreground' : ''}"
						>
							<LayoutGrid class="h-5 w-5" />
							Catalog
						</a>

						<Separator class="my-4" />

						<a
							href="/tools"
							onclick={() => (sheetOpen = false)}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground {isActive('/tools') ? 'bg-primary/10 text-foreground' : ''}"
						>
							<Ruler class="h-5 w-5" />
							Tools
						</a>

						<a
							href="/settings"
							onclick={() => (sheetOpen = false)}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground {isActive('/settings') ? 'bg-primary/10 text-foreground' : ''}"
						>
							<Settings class="h-5 w-5" />
							Settings
						</a>

						<Separator class="my-4" />

						<button
							onclick={logout}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
						>
							<LogOut class="h-5 w-5" />
							Sign Out
						</button>
					</nav>
				</Sheet.Content>
			</Sheet.Root>
		{/if}

		<!-- Logo -->
		<a href="/" class="md:mx-0">
			<img src={logo} class="h-12" alt="Busser Logo" />
		</a>

		<!-- Desktop Navigation Links -->
		{#if user}
			<div class="hidden md:flex md:items-center md:gap-6">
				<a
					href="/"
					class="text-sm font-medium transition-colors hover:text-primary {isActive('/') ? 'text-primary' : 'text-muted-foreground'}"
				>
					Home
				</a>
				<a
					href="/inventory"
					class="text-sm font-medium transition-colors hover:text-primary {isActive('/inventory') ? 'text-primary' : 'text-muted-foreground'}"
				>
					Inventory
				</a>
				<a
					href="/catalog"
					class="text-sm font-medium transition-colors hover:text-primary {isActive('/catalog') ? 'text-primary' : 'text-muted-foreground'}"
				>
					Catalog
				</a>
			</div>
		{/if}

		<!-- User Menu (Desktop) -->
		{#if user}
			<div class="hidden md:block">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Placeholder id="avatar-menu" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-56 glass-dropdown" align="end">
						<DropdownMenu.Label>
							<div class="flex flex-col space-y-1">
								<p class="text-sm font-medium">{user?.username}</p>
								<p class="text-xs text-muted-foreground">{user?.email}</p>
							</div>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="cursor-pointer" onclick={() => goto('/settings')}>
							<Settings class="mr-2 h-4 w-4" />
							Settings
						</DropdownMenu.Item>
						<DropdownMenu.Item class="cursor-pointer" onclick={() => goto('/tools')}>
							<Ruler class="mr-2 h-4 w-4" />
							Tools
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={logout} class="cursor-pointer">
							<LogOut class="mr-2 h-4 w-4" />
							Sign out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{/if}
	</div>
</nav>

<style>
	.user-nav {
		width: 40px;
	}
</style>
