<script lang="ts">
	import {
		AlertCircle,
		ArrowRight,
		Building2,
		Crown,
		Globe,
		LogOut,
		User,
		Users,
	} from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

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

	const GLOBAL_WORKSPACE_ID = 'ws-global-catalog';

	// Local state
	let selectedWorkspaceId = $state<string | null>(null);
	let setAsDefault = $state(true);
	let isSubmitting = $state(false);

	// Check if workspace is global
	function isGlobalWorkspace(workspaceId: string): boolean {
		return workspaceId === GLOBAL_WORKSPACE_ID;
	}

	// Select a workspace
	function selectWorkspace(workspaceId: string) {
		selectedWorkspaceId = workspaceId;
	}
</script>

<svelte:head>
	<title>Select Workspace - Busser</title>
</svelte:head>

<!-- Header -->
<div class="text-center mb-6">
	<h1 class="text-xl font-bold">Select a Workspace</h1>
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
			<Building2 class="h-6 w-6 text-muted-foreground/50" />
		</div>
		<h3 class="font-semibold mb-1">No Workspaces Available</h3>
		<p class="text-muted-foreground text-sm">
			You don't have access to any workspaces yet. Please contact an administrator.
		</p>
	</div>
{:else}
	<!-- Workspace List -->
	<div class="space-y-2 mb-4 max-h-64 overflow-y-auto">
		{#each data.workspaces as workspace (workspace.workspaceId)}
			<button
				type="button"
				onclick={() => selectWorkspace(workspace.workspaceId)}
				class="w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all {selectedWorkspaceId ===
				workspace.workspaceId
					? 'border-primary bg-primary/5'
					: 'border-transparent bg-muted/30 hover:bg-muted/50'}"
			>
				<div class="flex items-center gap-3">
					<div
						class="p-2 rounded-lg {isGlobalWorkspace(workspace.workspaceId)
							? 'bg-blue-500/10'
							: workspace.workspaceType === 'personal'
								? 'bg-purple-500/10'
								: 'bg-green-500/10'}"
					>
						{#if isGlobalWorkspace(workspace.workspaceId)}
							<Globe class="h-4 w-4 text-blue-500" />
						{:else if workspace.workspaceType === 'personal'}
							<User class="h-4 w-4 text-purple-500" />
						{:else}
							<Users class="h-4 w-4 text-green-500" />
						{/if}
					</div>
					<div class="text-left">
						<div class="font-medium text-sm flex items-center gap-2">
							{workspace.workspaceName}
							{#if isGlobalWorkspace(workspace.workspaceId)}
								<Badge variant="outline" class="text-xs">Global</Badge>
							{/if}
						</div>
						<div class="text-xs text-muted-foreground capitalize">
							{workspace.workspaceType} workspace
						</div>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="capitalize text-xs">
						{#if workspace.workspaceRole === 'owner'}
							<Crown class="h-3 w-3 mr-1" />
						{/if}
						{workspace.workspaceRole}
					</Badge>
					{#if selectedWorkspaceId === workspace.workspaceId}
						<div class="w-2 h-2 rounded-full bg-primary"></div>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<!-- Set as default checkbox -->
	<div class="flex items-center gap-2 mb-4">
		<Checkbox
			id="setAsDefault"
			checked={setAsDefault}
			onCheckedChange={(checked) => (setAsDefault = checked === true)}
		/>
		<Label for="setAsDefault" class="text-sm text-muted-foreground cursor-pointer">
			Remember as my default workspace
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
