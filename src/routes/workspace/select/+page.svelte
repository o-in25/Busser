<script lang="ts">
	import {
		AlertCircle,
		ArrowRight,
		Globe,
		HelpCircle,
		GalleryHorizontalEnd,
		LogOut,
		User,
		Users,
	} from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import WorkspaceList from '$lib/components/WorkspaceList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	async function signOut() {
		const response = await fetch('/logout', {
			method: 'POST',
			body: new FormData(),
		});
		if (response.ok) {
			await invalidateAll();
			await goto('/');
		}
	}

	let selectedWorkspaceId = $state<string | null>(null);
	let setAsDefault = $state(true);
	let isSubmitting = $state(false);

	function selectWorkspace(workspaceId: string) {
		selectedWorkspaceId = workspaceId;
	}
</script>

<svelte:head>
	<title>Select Workspace - Busser</title>
</svelte:head>

<!-- Header -->
<div class="text-center mb-6">
	<div class="flex items-center justify-center gap-1.5">
		<h1 class="text-xl font-bold">Select Workspace</h1>
		<Popover.Root>
			<Popover.Trigger
				class="text-muted-foreground hover:text-foreground transition-colors rounded-full"
			>
				<HelpCircle class="h-4 w-4" />
				<span class="sr-only">What are Workspaces?</span>
			</Popover.Trigger>
			<Popover.Content class="w-72 text-sm text-left" align="center">
				<p class="font-semibold mb-2">What are Workspaces?</p>
				<p class="text-muted-foreground mb-3">
					Workspaces let you organize your bar separately, each with its own inventory, recipes, and
					catalog.
				</p>
				<div class="space-y-2 mb-3">
					<div class="flex items-start gap-2">
						<Globe class="h-3.5 w-3.5 text-blue-500 mt-1 shrink-0" />
						<p class="text-muted-foreground">
							<span class="text-foreground font-medium">Global</span> &mdash; a shared, read-only
							catalog of every recipe and ingredient available to all Busser users.
						</p>
					</div>
					<div class="flex items-start gap-2">
						<User class="h-3.5 w-3.5 text-secondary-500 mt-1 shrink-0" />
						<p class="text-muted-foreground">
							<span class="text-foreground font-medium">Personal</span> &mdash; your private Workspace
							with full control over your own catalog and inventory.
						</p>
					</div>
					<div class="flex items-start gap-2">
						<Users class="h-3.5 w-3.5 text-neon-green-500 mt-1 shrink-0" />
						<p class="text-muted-foreground">
							<span class="text-foreground font-medium">Shared</span> &mdash; a collaborative Workspace
							where multiple users manage a shared catalog and inventory.
						</p>
					</div>
				</div>
				<p class="text-muted-foreground text-xs border-t border-border/50 pt-2">
					Owners can invite members and manage settings from Workspace Settings.
				</p>
			</Popover.Content>
		</Popover.Root>
	</div>
	<p class="text-muted-foreground text-sm mt-1">Choose which workspace you'd like to work in</p>
</div>

<!-- Error Message -->
{#if form?.error}
	<div
		class="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm mb-4 flex items-center gap-2"
	>
		<AlertCircle class="h-4 w-4 flex-shrink-0" />
		{form.error}
	</div>
{/if}

<!-- No Workspaces State -->
{#if data.hasNoWorkspaces}
	<div class="flex flex-col items-center justify-center py-8 text-center">
		<div class="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
			<GalleryHorizontalEnd class="h-6 w-6 text-muted-foreground/50" />
		</div>
		<h3 class="font-semibold mb-1">No Workspaces Available</h3>
		<p class="text-muted-foreground text-sm">
			You don't have access to any workspaces yet. Please contact an administrator.
		</p>
	</div>
{:else}
	<!-- Workspace List -->
	<div class="mb-4 max-h-64 overflow-y-auto">
		<WorkspaceList
			workspaces={data.workspaces}
			activeWorkspaceId={selectedWorkspaceId}
			onSelect={selectWorkspace}
		/>
	</div>

	<!-- Set as default checkbox -->
	<div class="flex items-center gap-2 mb-4">
		<Checkbox
			id="setAsDefault"
			checked={setAsDefault}
			onCheckedChange={(checked) => (setAsDefault = checked === true)}
		/>
		<Label for="setAsDefault" class="text-sm text-muted-foreground cursor-pointer">
			Remember as my preferred workspace
		</Label>
	</div>

	<!-- Submit form -->
	<form
		method="POST"
		action="?/select"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				isSubmitting = false;
				await update();
			};
		}}
	>
		<input type="hidden" name="workspaceId" value={selectedWorkspaceId || ''} />
		<input type="hidden" name="setAsDefault" value={setAsDefault ? 'true' : 'false'} />
		<Button type="submit" class="w-full" disabled={!selectedWorkspaceId || isSubmitting}>
			{#if isSubmitting}
				Entering workspace...
			{:else}
				Continue
				<ArrowRight class="h-4 w-4 ml-2" />
			{/if}
		</Button>
	</form>
{/if}

<!-- Sign out link -->
<div class="mt-6 pt-4 border-t border-border/50 text-center">
	<button
		type="button"
		onclick={signOut}
		class="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
	>
		<LogOut class="h-3 w-3" />
		Sign out
	</button>
</div>
