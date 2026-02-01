<script lang="ts">
	import {
		ClipboardList,
		Home,
		LayoutGrid,
		LogOut,
		Ruler,
		Settings,
	} from 'lucide-svelte';

	import { goto, invalidateAll } from '$app/navigation';
	import logoNav from '$lib/assets/logo-nav.png';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import type { User } from '$lib/types/auth';
	import Placeholder from './Placeholder.svelte';

	let { user, activeUrl }: { user: User | null; activeUrl: string } = $props();

	async function logout() {
		const response = await fetch('/logout', {
			method: 'POST',
			body: new FormData(),
		});
		if (response.ok) {
			await invalidateAll();
			await goto(`/`);
		}
	}

	function isActive(path: string): boolean {
		if (!activeUrl) return false;
		if (path === '/') {
			return activeUrl === '/';
		}
		return activeUrl.startsWith(path);
	}

	const navItems = [
		{ href: '/', icon: Home, label: 'Home' },
		{ href: '/inventory', icon: ClipboardList, label: 'Inventory' },
		{ href: '/catalog', icon: LayoutGrid, label: 'Catalog' },
		{ href: '/tools', icon: Ruler, label: 'Tools' },
		{ href: '/settings', icon: Settings, label: 'Settings' },
	];
</script>

<!-- Mobile Top Logo (visible on small screens) -->
{#if user}
	<div class="mobile-logo-header flex md:hidden">
		<a href="/">
			<img src={logoNav} class="h-8" alt="Busser" />
		</a>
	</div>
{/if}

<!-- Mobile Bottom Navigation (visible on small screens) -->
{#if user}
	<nav class="mobile-nav-container flex md:hidden">
		<div class="mobile-nav-pill">
			{#each navItems as item}
				<a
					href={item.href}
					class="mobile-nav-item {isActive(item.href) ? 'active' : ''}"
				>
					<item.icon class="h-5 w-5" />
					<span class="mobile-nav-label">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
{/if}

<!-- Desktop Top Navigation (visible on medium+ screens) -->
<nav class="desktop-nav hidden md:block">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4">
		<!-- Logo (left) -->
		<a href="/" class="flex-shrink-0">
			<img src={logoNav} class="h-10" alt="Busser" />
		</a>

		<!-- Center nav pill -->
		{#if user}
			<div class="desktop-nav-pill">
				{#each navItems as item}
					<a
						href={item.href}
						class="desktop-nav-item {isActive(item.href) ? 'active' : ''}"
					>
						<item.icon class="h-4 w-4" />
						<span>{item.label}</span>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Avatar (right) -->
		{#if user}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="desktop-avatar-button">
					<Placeholder id="avatar-desktop" src={user?.avatarImageUrl} />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="w-56 glass-dropdown" align="end">
					<DropdownMenu.Label>
						<div class="flex flex-col space-y-1">
							<p class="text-sm font-medium">{user?.username}</p>
							<p class="text-xs text-muted-foreground">{user?.email}</p>
						</div>
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onclick={logout} class="cursor-pointer">
						<LogOut class="mr-2 h-4 w-4" />
						Sign out
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{:else}
			<!-- Empty placeholder to maintain layout when logged out -->
			<div class="w-10"></div>
		{/if}
	</div>
</nav>

<style>
	/* mobile top logo */
	.mobile-logo-header {
		position: sticky;
		top: 0;
		z-index: 50;
		justify-content: center;
		padding: 0.5rem 0;
		backdrop-filter: blur(20px) saturate(1.5);
		-webkit-backdrop-filter: blur(20px) saturate(1.5);
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.8) 0%,
			rgba(255, 255, 255, 0.6) 100%
		);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	:global(.dark) .mobile-logo-header {
		background: linear-gradient(
			180deg,
			rgba(24, 24, 27, 0.8) 0%,
			rgba(24, 24, 27, 0.6) 100%
		);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* mobile bottom nav container */
	.mobile-nav-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 50;
		padding: 0.5rem;
		padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
		justify-content: center;
	}

	/* mobile main nav pill */
	.mobile-nav-pill {
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0.375rem;
		border-radius: 9999px;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.7) 0%,
			rgba(253, 242, 248, 0.6) 50%,
			rgba(245, 243, 255, 0.6) 100%
		);
		backdrop-filter: blur(20px) saturate(1.5);
		-webkit-backdrop-filter: blur(20px) saturate(1.5);
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	:global(.dark) .mobile-nav-pill {
		background: linear-gradient(
			135deg,
			rgba(39, 39, 42, 0.7) 0%,
			rgba(50, 30, 40, 0.6) 50%,
			rgba(40, 30, 50, 0.6) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* mobile nav item */
	.mobile-nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.375rem 0.625rem;
		border-radius: 9999px;
		color: rgba(113, 113, 122, 1);
		transition: all 0.2s ease;
		text-decoration: none;
		min-width: 3rem;
	}

	.mobile-nav-item:hover {
		color: rgba(63, 63, 70, 1);
	}

	.mobile-nav-item.active {
		background: linear-gradient(
			135deg,
			rgba(232, 25, 95, 0.15) 0%,
			rgba(165, 125, 213, 0.15) 100%
		);
		color: rgba(232, 25, 95, 1);
		box-shadow: 0 2px 8px rgba(232, 25, 95, 0.2);
	}

	:global(.dark) .mobile-nav-item {
		color: rgba(161, 161, 170, 1);
	}

	:global(.dark) .mobile-nav-item:hover {
		color: rgba(212, 212, 216, 1);
	}

	:global(.dark) .mobile-nav-item.active {
		background: linear-gradient(
			135deg,
			rgba(248, 78, 128, 0.2) 0%,
			rgba(165, 125, 213, 0.2) 100%
		);
		color: rgba(248, 78, 128, 1);
		box-shadow: 0 2px 8px rgba(248, 78, 128, 0.25);
	}

	.mobile-nav-label {
		font-size: 0.625rem;
		font-weight: 500;
		margin-top: 0.125rem;
		white-space: nowrap;
	}

	/* desktop top nav */
	.desktop-nav {
		position: sticky;
		top: 0;
		z-index: 50;
		width: 100%;
		padding: 0.75rem 0;
		backdrop-filter: blur(20px) saturate(1.5);
		-webkit-backdrop-filter: blur(20px) saturate(1.5);
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.8) 0%,
			rgba(255, 255, 255, 0.6) 100%
		);
		border-bottom: 1px solid rgba(255, 255, 255, 0.3);
	}

	:global(.dark) .desktop-nav {
		background: linear-gradient(
			180deg,
			rgba(24, 24, 27, 0.8) 0%,
			rgba(24, 24, 27, 0.6) 100%
		);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* desktop nav pill */
	.desktop-nav-pill {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem;
		border-radius: 9999px;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.6) 0%,
			rgba(253, 242, 248, 0.5) 50%,
			rgba(245, 243, 255, 0.5) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	:global(.dark) .desktop-nav-pill {
		background: linear-gradient(
			135deg,
			rgba(39, 39, 42, 0.6) 0%,
			rgba(50, 30, 40, 0.5) 50%,
			rgba(40, 30, 50, 0.5) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	/* desktop nav item */
	.desktop-nav-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgba(113, 113, 122, 1);
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.desktop-nav-item:hover {
		color: rgba(63, 63, 70, 1);
		background: rgba(0, 0, 0, 0.03);
	}

	.desktop-nav-item.active {
		background: linear-gradient(
			135deg,
			rgba(232, 25, 95, 0.12) 0%,
			rgba(165, 125, 213, 0.12) 100%
		);
		color: rgba(232, 25, 95, 1);
		box-shadow: 0 2px 8px rgba(232, 25, 95, 0.15);
	}

	:global(.dark) .desktop-nav-item {
		color: rgba(161, 161, 170, 1);
	}

	:global(.dark) .desktop-nav-item:hover {
		color: rgba(212, 212, 216, 1);
		background: rgba(255, 255, 255, 0.05);
	}

	:global(.dark) .desktop-nav-item.active {
		background: linear-gradient(
			135deg,
			rgba(248, 78, 128, 0.18) 0%,
			rgba(165, 125, 213, 0.18) 100%
		);
		color: rgba(248, 78, 128, 1);
		box-shadow: 0 2px 8px rgba(248, 78, 128, 0.2);
	}

	/* desktop avatar button */
	.desktop-avatar-button {
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.2s ease;
	}

	.desktop-avatar-button:hover {
		opacity: 0.8;
	}
</style>
