<script lang="ts">
	import {
		UsersOutline,
		AdjustmentsVerticalSolid,
		UserSettingsOutline,
		UsersGroupOutline,
		MailBoxOutline,
	} from 'flowbite-svelte-icons';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	$: activeUrl$ = $page.url.pathname;
	const permissions: string[] = getContext('permissions') || [];

	let activeClass =
		'inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-primary-600 bg-gray-100 rounded-t-lg dark:bg-gray-800 dark:text-primary-500';
	let defaultClass =
		'inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300';
</script>

<ul class="flex flex-wrap space-x-2 rtl:space-x-reverse">
	<li
		class="group"
		role="presentation"
	>
		<a
			href="/settings"
			type="button"
			role="tab"
			class={activeUrl$ === '/settings' ? activeClass : defaultClass}
		>
			<div class="flex items-center gap-2">
				<AdjustmentsVerticalSolid size="md" /><span class="hidden md:inline-block">General</span>
			</div>
		</a>
	</li>
	<li
		class="group"
		role="presentation"
	>
		<a
			href="/settings/user-account"
			type="button"
			role="tab"
			class={activeUrl$.includes('account') ? activeClass : defaultClass}
		>
			<div class="flex items-center gap-2">
				<UserSettingsOutline size="md" /><span class="hidden md:inline-block">Account</span>
			</div>
		</a>
	</li>
	{#if permissions.includes('view_admin')}
		<li
			class="group"
			role="presentation"
		>
			<a
				href="/settings/users"
				type="button"
				role="tab"
				class={activeUrl$.includes('/users') ? activeClass : defaultClass}
			>
				<div class="flex items-center gap-2">
					<UsersOutline size="md" /><span class="hidden md:inline-block">Users</span>
				</div>
			</a>
		</li>
	{/if}
  {#if permissions.includes('edit_admin')}
  <li
    class="group"
    role="presentation"
  >
    <a
      href="/settings/user-permissions"
      type="button"
      role="tab"
      class={activeUrl$.includes('permissions') ? activeClass : defaultClass}
    >
      <div class="flex items-center gap-2">
        <UsersGroupOutline size="md" /><span class="hidden md:inline-block">Grants & Roles</span>
      </div>
    </a>
  </li>
{/if}
{#if permissions.includes('edit_admin')}
<li
  class="group"
  role="presentation"
>
  <a
    href="/settings/user-invitations"
    type="button"
    role="tab"
    class={activeUrl$.includes('invitations') ? activeClass : defaultClass}
  >
    <div class="flex items-center gap-2">
      <MailBoxOutline size="md" /><span class="hidden md:inline-block">Invites</span>
    </div>
  </a>
</li>
{/if}
</ul>
<div class="h-0.5 bg-gray-200 dark:bg-gray-700"></div>
<div class="p-4 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4">
	<slot />
</div>
