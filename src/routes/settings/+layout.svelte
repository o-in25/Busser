<script lang="ts">
	import { Users, SlidersHorizontal, UserCog, UsersRound, Mail, Building2 } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';

	$: activeUrl$ = $page.url.pathname;
	const permissions: string[] = getContext('permissions') || [];

	let activeClass =
		'inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-primary-600 bg-white/60 dark:bg-zinc-800/50 backdrop-blur-sm rounded-t-lg dark:text-primary-500';
	let defaultClass =
		'inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-white/40 dark:text-gray-400 dark:hover:bg-zinc-800/40 dark:hover:text-gray-300 transition-colors';
</script>

<ul class="flex flex-wrap space-x-2 rtl:space-x-reverse">
	<li class="group" role="presentation">
		<a
			href="/settings"
			type="button"
			role="tab"
			class={activeUrl$ === '/settings' ? activeClass : defaultClass}
		>
			<div class="flex items-center gap-2">
				<SlidersHorizontal class="h-5 w-5" /><span class="hidden md:inline-block">General</span>
			</div>
		</a>
	</li>
	<li class="group" role="presentation">
		<a
			href="/settings/user-account"
			type="button"
			role="tab"
			class={activeUrl$.includes('account') ? activeClass : defaultClass}
		>
			<div class="flex items-center gap-2">
				<UserCog class="h-5 w-5" /><span class="hidden md:inline-block">Account</span>
			</div>
		</a>
	</li>
	{#if permissions.includes('view_admin')}
		<li class="group" role="presentation">
			<a
				href="/settings/users"
				type="button"
				role="tab"
				class={activeUrl$.includes('/users') ? activeClass : defaultClass}
			>
				<div class="flex items-center gap-2">
					<Users class="h-5 w-5" /><span class="hidden md:inline-block">Users</span>
				</div>
			</a>
		</li>
	{/if}
	{#if permissions.includes('edit_admin')}
		<li class="group" role="presentation">
			<a
				href="/settings/user-permissions"
				type="button"
				role="tab"
				class={activeUrl$.includes('permissions') ? activeClass : defaultClass}
			>
				<div class="flex items-center gap-2">
					<UsersRound class="h-5 w-5" /><span class="hidden md:inline-block">Grants & Roles</span>
				</div>
			</a>
		</li>
	{/if}
	{#if permissions.includes('edit_admin')}
		<li class="group" role="presentation">
			<a
				href="/settings/user-invitations"
				type="button"
				role="tab"
				class={activeUrl$.includes('invitations') ? activeClass : defaultClass}
			>
				<div class="flex items-center gap-2">
					<Mail class="h-5 w-5" /><span class="hidden md:inline-block">Invites</span>
				</div>
			</a>
		</li>
	{/if}
	{#if permissions.includes('edit_admin')}
		<li class="group" role="presentation">
			<a
				href="/settings/workspaces"
				type="button"
				role="tab"
				class={activeUrl$.includes('workspaces') ? activeClass : defaultClass}
			>
				<div class="flex items-center gap-2">
					<Building2 class="h-5 w-5" /><span class="hidden md:inline-block">Workspaces</span>
				</div>
			</a>
		</li>
	{/if}
</ul>
<div class="h-0.5 bg-zinc-200/50 dark:bg-zinc-700/40"></div>
<div class="p-4 glass-surface mt-4">
	<slot />
</div>
