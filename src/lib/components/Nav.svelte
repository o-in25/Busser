<script lang="ts">
	import {
		ClipboardList,
		Cookie,
		ExternalLink,
		Facebook,
		FileText,
		Github,
		House,
		Info,
		Instagram,
		LayoutGrid,
		LogIn,
		LogOut,
		Menu,
		Ruler,
		Settings,
		Shield,
		Sparkles,
		Twitter,
	} from 'lucide-svelte';

	import { goto, invalidateAll } from '$app/navigation';
	import logoNav from '$lib/assets/logo-nav.png';
	import { haptics } from '$lib/utils/haptics';
	import NavigationProgress from './NavigationProgress.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from '$lib/components/ui/sheet';
	import type { User } from '$lib/types/auth';
	import Placeholder from './Placeholder.svelte';

	let mobileMenuOpen = $state(false);

	let {
		user,
		activeUrl,
		workspaceName,
		keyboardOpen = false,
	}: {
		user: User | null;
		activeUrl: string;
		workspaceName?: string | null;
		keyboardOpen?: boolean;
	} = $props();

	// scroll direction tracking for mobile header
	let lastScrollY = $state(0);
	let headerVisible = $state(true);
	const scrollThreshold = 10;

	$effect(() => {
		if (typeof window === 'undefined') return;

		function handleScroll() {
			const currentScrollY = window.scrollY;
			const scrollDelta = currentScrollY - lastScrollY;

			// only trigger if scroll exceeds threshold
			if (Math.abs(scrollDelta) > scrollThreshold) {
				if (scrollDelta > 0 && currentScrollY > 50) {
					// scrolling down and past the top
					headerVisible = false;
				} else {
					// scrolling up
					headerVisible = true;
				}
				lastScrollY = currentScrollY;
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

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
		{ href: '/', icon: House, label: 'Home' },
		{ href: '/inventory', icon: ClipboardList, label: 'Inventory' },
		{ href: '/catalog', icon: LayoutGrid, label: 'Catalog' },
		{ href: '/assistant', icon: Sparkles, label: 'Assistant' },
		{ href: '/tools', icon: Ruler, label: 'Tools' },
	];

	// logged-out users only see what they can actually use — inventory/ai are dead-ends for them
	const publicHrefs = new Set(['/', '/catalog', '/tools']);
	const items = $derived(user ? navItems : navItems.filter((i) => publicHrefs.has(i.href)));
</script>

<!-- Mobile Top Logo (visible on small screens) -->
<div class="mobile-logo-header glass-nav flex md:hidden" class:header-hidden={!headerVisible}>
	<Sheet.Root bind:open={mobileMenuOpen}>
		<Sheet.Trigger
			class="relative z-10 w-8 h-8 flex items-center justify-center cursor-pointer"
			aria-label="Open menu"
		>
			<Menu class="h-5 w-5 text-muted-foreground" />
		</Sheet.Trigger>
		<Sheet.Content side="left" class="flex flex-col">
			<Sheet.Header class="text-left shrink-0">
				{#if user}
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full flex-shrink-0">
							<Placeholder id="avatar-drawer" src={user?.avatarImageUrl} />
						</div>
						<div class="flex flex-col">
							<Sheet.Title class="text-sm font-medium">{user?.username}</Sheet.Title>
							<Sheet.Description class="text-xs text-muted-foreground"
								>{user?.email}</Sheet.Description
							>
							{#if workspaceName}
								<span class="text-xs text-muted-foreground/70 mt-0.5">{workspaceName}</span>
							{/if}
						</div>
					</div>
				{:else}
					<div class="flex items-center gap-3">
						<img src={logoNav} class="h-9" alt="Busser" />
						<div class="flex flex-col">
							<Sheet.Title class="text-sm font-medium">Busser</Sheet.Title>
							<Sheet.Description class="text-xs text-muted-foreground">
								Sign in to manage your bar
							</Sheet.Description>
						</div>
					</div>
				{/if}
			</Sheet.Header>

			<div class="h-px bg-border my-4 shrink-0"></div>

			<!-- scrollable content -->
			<div class="flex-1 overflow-y-auto min-h-0">
				{#if user}
					<!-- Main -->
					<div class="flex flex-col gap-1">
						<button
							class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left focus:outline-none"
							onclick={() => {
								mobileMenuOpen = false;
								goto('/settings');
							}}
						>
							<Settings class="h-4 w-4 text-muted-foreground" />
							Settings
						</button>
					</div>

					<div class="h-px bg-border my-4"></div>
				{/if}

				<!-- Legal -->
				<p class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
					Legal
				</p>
				<div class="flex flex-col gap-1">
					<a
						href="/privacy"
						onclick={() => {
							mobileMenuOpen = false;
						}}
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors focus:outline-none"
					>
						<Shield class="h-4 w-4 text-muted-foreground" />
						Privacy Policy
					</a>
					<a
						href="/terms"
						onclick={() => {
							mobileMenuOpen = false;
						}}
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors focus:outline-none"
					>
						<FileText class="h-4 w-4 text-muted-foreground" />
						Terms of Service
					</a>
					<a
						href="/cookies"
						onclick={() => {
							mobileMenuOpen = false;
						}}
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors focus:outline-none"
					>
						<Cookie class="h-4 w-4 text-muted-foreground" />
						Cookie Policy
					</a>
				</div>

				<div class="h-px bg-border my-4"></div>

				<!-- Help & Contribute -->
				<p class="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
					Help & Contribute
				</p>
				<div class="flex flex-col gap-1">
					<a
						href="/about"
						onclick={() => {
							mobileMenuOpen = false;
						}}
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors focus:outline-none"
					>
						<Info class="h-4 w-4 text-muted-foreground" />
						About
					</a>
					<a
						href="https://github.com/o-in25/Busser"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors focus:outline-none"
					>
						<Github class="h-4 w-4 text-muted-foreground" />
						GitHub
						<ExternalLink class="h-3 w-3 text-muted-foreground/50 ml-auto" />
					</a>
				</div>
			</div>

			<!-- pinned to bottom: auth action + socials -->
			<div class="shrink-0 pt-4 border-t border-border flex flex-col gap-4">
				{#if user}
					<button
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left focus:outline-none"
						onclick={() => {
							mobileMenuOpen = false;
							logout();
						}}
					>
						<LogOut class="h-4 w-4 text-muted-foreground" />
						Sign out
					</button>
				{:else}
					<button
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full text-left focus:outline-none"
						onclick={() => {
							mobileMenuOpen = false;
							goto('/login');
						}}
					>
						<LogIn class="h-4 w-4 text-muted-foreground" />
						Sign in
					</button>
				{/if}

				<!-- Social -->
				<div class="flex items-center gap-4 px-3">
					<a
						href="https://instagram.com/busserapp"
						target="_blank"
						rel="noopener noreferrer"
						class="text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Instagram"
					>
						<Instagram class="h-5 w-5" />
					</a>
					<a
						href="https://www.facebook.com/profile.php?id=61588019103189"
						target="_blank"
						rel="noopener noreferrer"
						class="text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Facebook"
					>
						<Facebook class="h-5 w-5" />
					</a>
					<a
						href="https://x.com/busserapp"
						target="_blank"
						rel="noopener noreferrer"
						class="text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Twitter"
					>
						<Twitter class="h-5 w-5" />
					</a>
				</div>
			</div>
		</Sheet.Content>
	</Sheet.Root>
	<a href="/" class="mobile-header-logo">
		<img src={logoNav} class="h-10" alt="Busser" />
	</a>
</div>

<!-- Mobile Bottom Navigation (visible on small screens) -->
<nav class="mobile-nav-container flex md:hidden" class:nav-hidden={keyboardOpen}>
	<!-- thin progress line above the pill — feedback near the thumb when tapping the bottom nav -->
	<NavigationProgress variant="bottom" />
	<div class="mobile-nav-pill glass-nav-pill">
		{#each items as item}
			<a
				href={item.href}
				class="mobile-nav-item {isActive(item.href) ? 'active' : ''}"
				onclick={() => haptics.light()}
			>
				<item.icon class="h-5 w-5" />
				<span class="mobile-nav-label">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>

<!-- Desktop Top Navigation (visible on medium+ screens) -->
<nav class="desktop-nav glass-nav hidden md:block">
	<div class="mx-auto flex max-w-7xl items-center px-4">
		<!-- Logo (left) — flex-1 keeps the center pill balanced against the wider right side -->
		<div class="flex flex-1 justify-start">
			<a href="/" class="flex-shrink-0">
				<img src={logoNav} class="h-10" alt="Busser" />
			</a>
		</div>

		<!-- Center nav pill -->
		<div class="desktop-nav-pill glass-nav-pill">
			{#each items as item}
				<a href={item.href} class="desktop-nav-item {isActive(item.href) ? 'active' : ''}">
					<item.icon class="h-4 w-4" />
					<span>{item.label}</span>
				</a>
			{/each}
		</div>

		<!-- Avatar (right) or Sign In — matching flex-1 mirrors the logo side -->
		<div class="flex flex-1 justify-end">
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
								{#if workspaceName}
									<p class="text-xs text-muted-foreground/70">{workspaceName}</p>
								{/if}
							</div>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={() => goto('/settings')} class="cursor-pointer">
							<Settings class="mr-2 h-4 w-4" />
							Settings
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item onclick={logout} class="cursor-pointer">
							<LogOut class="mr-2 h-4 w-4" />
							Sign out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				<div class="flex items-center gap-2">
					<a href="/login" class="desktop-nav-item">Log In</a>
					<a href="/signup" class="glass-cta !py-2 !px-5 !text-sm">Sign Up</a>
				</div>
			{/if}
		</div>
	</div>
</nav>

<style>
	/* mobile top logo */
	.mobile-logo-header {
		position: sticky;
		top: 0;
		z-index: 50;
		align-items: center;
		/* min-height must fit the 2.5rem logo — without it the header collapses to the
		   hamburger height and the taller logo clips against the header edge when the
		   safe-area inset is 0 (i.e. non-pwa safari) */
		min-height: calc(4rem + env(safe-area-inset-top, 0px));
		padding: calc(0.75rem + env(safe-area-inset-top, 0px)) 1.25rem 0.75rem;
		/* glass comes from the glass-nav tier (frosted default); this owns only layout */
		transition: transform 0.3s ease;
	}

	.mobile-header-logo {
		position: absolute;
		left: 50%;
		/* anchor to the content start (below the safe area); logo height == content height
		   so it stays vertically centered against the hamburger regardless of the inset */
		top: calc(0.75rem + env(safe-area-inset-top, 0px));
		transform: translateX(-50%);
	}

	.mobile-logo-header.header-hidden {
		transform: translateY(-100%);
	}


	/* mobile bottom nav container */
	.mobile-nav-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 50;
		padding: 0.5rem 0.75rem !important;
		padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
		justify-content: center;
		transition: transform 0.25s ease;
	}

	.mobile-nav-container.nav-hidden {
		transform: translateY(100%);
		pointer-events: none;
	}

	/* mobile main nav pill */
	/* glass comes from the glass-nav-pill utility; this owns only layout */
	.mobile-nav-pill {
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 0.125rem;
		padding: 0.375rem;
		border-radius: 9999px;
		width: 100%;
	}

	/* mobile nav item */
	.mobile-nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 0.375rem;
		min-height: 44px;
		min-width: 44px;
		border-radius: 9999px;
		color: rgba(113, 113, 122, 1);
		transition: all 0.2s ease;
		text-decoration: none;
		flex: 1;
	}

	.mobile-nav-item:hover {
		color: rgba(63, 63, 70, 1);
	}

	.mobile-nav-item.active {
		background: rgba(232, 25, 95, 0.25);
		color: rgba(232, 25, 95, 1);
		box-shadow: 0 0 12px rgba(248, 78, 128, 0.25);
		border: 1px solid rgba(232, 25, 95, 0.3);
	}

	:global(.dark) .mobile-nav-item {
		color: rgba(161, 161, 170, 1);
	}

	:global(.dark) .mobile-nav-item:hover {
		color: rgba(212, 212, 216, 1);
	}

	:global(.dark) .mobile-nav-item.active {
		background: rgba(248, 78, 128, 0.2);
		border: 1px solid rgba(248, 78, 128, 0.3);
		color: rgba(248, 78, 128, 1);
		box-shadow:
			0 0 12px rgba(248, 78, 128, 0.25),
			0 0 24px rgba(248, 78, 128, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.mobile-nav-label {
		font-size: 0.6875rem;
		font-weight: 500;
		margin-top: 0.125rem;
		white-space: nowrap;
	}

	/* desktop top nav */
	/* glass comes from the glass-nav tier (frosted default); this owns only layout */
	.desktop-nav {
		position: sticky;
		top: 0;
		z-index: 50;
		width: 100%;
		padding: 0.75rem 0;
	}

	/* glass comes from the glass-nav-pill utility; this owns only layout */
	.desktop-nav-pill {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem;
		border-radius: 9999px;
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
		background: rgba(232, 25, 95, 0.25);
		color: rgba(232, 25, 95, 1);
		box-shadow: 0 0 12px rgba(248, 78, 128, 0.25);
		border: 1px solid rgba(232, 25, 95, 0.3);
	}

	:global(.dark) .desktop-nav-item {
		color: rgba(161, 161, 170, 1);
	}

	:global(.dark) .desktop-nav-item:hover {
		color: rgba(212, 212, 216, 1);
		background: rgba(255, 255, 255, 0.05);
	}

	:global(.dark) .desktop-nav-item.active {
		background: rgba(248, 78, 128, 0.2);
		border: 1px solid rgba(248, 78, 128, 0.3);
		color: rgba(248, 78, 128, 1);
		box-shadow: 0 0 12px rgba(248, 78, 128, 0.25);
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

	/* avatar is self-evidently focusable, skip the global ring.
	   :global needed since the class lands on the Trigger child element */
	:global(.desktop-avatar-button:focus),
	:global(.desktop-avatar-button:focus-visible) {
		outline: none;
		outline-offset: 0;
		box-shadow: none;
	}

	/* drawer logo glow (matches home page hero) */
	.drawer-logo-glow {
		animation: drawer-glow 3s ease-in-out infinite;
	}

	@keyframes drawer-glow {
		0%,
		100% {
			filter: drop-shadow(0 0 8px rgba(165, 125, 213, 0.3));
		}
		50% {
			filter: drop-shadow(0 0 20px rgba(248, 78, 128, 0.5));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.drawer-logo-glow {
			animation: none;
			filter: drop-shadow(0 0 8px rgba(165, 125, 213, 0.3));
		}
	}
</style>
