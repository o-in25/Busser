<script lang="ts">
	import { GalleryHorizontalEnd, Mail, SlidersHorizontal, UserCog, Users, UsersRound } from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { page } from '$app/stores';

	$: activeUrl$ = $page.url.pathname;
	const permissions: string[] = getContext('permissions') || [];
	const isAdmin = permissions.includes('view_admin');

	// for non-admin users, /settings/users/{id}/edit is reached from Account
	$: isAccountActive =
		activeUrl$.includes('account') || (!isAdmin && activeUrl$.includes('/users/'));

	let activeClass =
		'block w-full text-sm font-medium text-center disabled:cursor-not-allowed px-3 py-2 text-primary-foreground bg-primary/25 dark:bg-primary/20 backdrop-blur-sm ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)] rounded-xl';
	let defaultClass =
		'block w-full text-sm font-medium text-center disabled:cursor-not-allowed px-3 py-2 text-muted-foreground rounded-xl hover:bg-white/10 dark:hover:bg-zinc-700/25 hover:text-foreground transition-all duration-200';
</script>

<nav class="flex md:inline-flex rounded-xl backdrop-blur-xl bg-white/10 dark:bg-zinc-800/30 shadow-lg shadow-black/5 dark:shadow-black/15 p-0.5 mb-4">
<ul class="flex w-full flex-wrap md:flex-nowrap space-x-1 rtl:space-x-reverse">
	<li class="group flex-1" role="presentation">
		<a
			href="/settings"
			type="button"
			role="tab"
			class={activeUrl$ === '/settings' ? activeClass : defaultClass}
		>
			<div class="flex items-center justify-center gap-2">
				<SlidersHorizontal class="h-5 w-5" /><span class="hidden md:inline-block">General</span>
			</div>
		</a>
	</li>
	<li class="group flex-1" role="presentation">
		<a
			href="/settings/user-account"
			type="button"
			role="tab"
			class={isAccountActive ? activeClass : defaultClass}
		>
			<div class="flex items-center justify-center gap-2">
				<UserCog class="h-5 w-5" /><span class="hidden md:inline-block">Account</span>
			</div>
		</a>
	</li>
	{#if permissions.includes('view_admin')}
		<li class="group flex-1" role="presentation">
			<a
				href="/settings/users"
				type="button"
				role="tab"
				class={activeUrl$.includes('/users') ? activeClass : defaultClass}
			>
				<div class="flex items-center justify-center gap-2">
					<Users class="h-5 w-5" /><span class="hidden md:inline-block">Users</span>
				</div>
			</a>
		</li>
	{/if}
	{#if permissions.includes('edit_admin')}
		<li class="group flex-1" role="presentation">
			<a
				href="/settings/user-permissions"
				type="button"
				role="tab"
				class={activeUrl$.includes('permissions') ? activeClass : defaultClass}
			>
				<div class="flex items-center justify-center gap-2">
					<UsersRound class="h-5 w-5" /><span class="hidden md:inline-block">Permissions</span>
				</div>
			</a>
		</li>
	{/if}
	{#if permissions.includes('edit_admin')}
		<li class="group flex-1" role="presentation">
			<a
				href="/settings/user-invitations"
				type="button"
				role="tab"
				class={activeUrl$.includes('invitations') ? activeClass : defaultClass}
			>
				<div class="flex items-center justify-center gap-2">
					<Mail class="h-5 w-5" /><span class="hidden md:inline-block">Invites</span>
				</div>
			</a>
		</li>
	{/if}
	<li class="group flex-1" role="presentation">
		<a
			href="/settings/workspaces"
			type="button"
			role="tab"
			class={activeUrl$.includes('workspaces') ? activeClass : defaultClass}
		>
			<div class="flex items-center justify-center gap-2">
				<GalleryHorizontalEnd class="h-5 w-5" /><span class="hidden md:inline-block">Workspaces</span>
			</div>
		</a>
	</li>
</ul>
</nav>
<div class="p-4 glass-surface">
	<slot />
</div>
