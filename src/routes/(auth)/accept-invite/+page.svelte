<script lang="ts">
	import { AlertCircle, Building2, Check, Crown, Eye, Pencil, X } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const roleLabels: Record<string, string> = {
		owner: 'Owner',
		editor: 'Editor',
		viewer: 'Viewer',
	};

	const roleDescriptions: Record<string, string> = {
		owner: 'Full access to manage members, settings, and all content',
		editor: 'Can create, edit, and delete recipes and inventory',
		viewer: 'Read-only access to view content',
	};

	const roleIcons: Record<string, typeof Crown> = {
		owner: Crown,
		editor: Pencil,
		viewer: Eye,
	};

	let isSubmitting = $state(false);

	// derived role icon
	const roleKey = $derived(data.invitation?.workspaceRole || 'viewer');
	const RoleIcon = $derived(roleIcons[roleKey]);
</script>

<svelte:head>
	<title>Accept Invitation - Busser</title>
</svelte:head>

<div class="flex flex-col space-y-6">
	<div class="text-center">
		<div
			class="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"
		>
			<Building2 class="h-6 w-6 text-primary" />
		</div>
		<h3 class="text-2xl font-semibold">Workspace Invitation</h3>
	</div>

	{#if data.error}
		<!-- Error state -->
		<div class="text-center space-y-4">
			<div
				class="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center"
			>
				<AlertCircle class="h-6 w-6 text-destructive" />
			</div>
			<p class="text-muted-foreground">{data.error}</p>
			<a href="/" class={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
				Go Home
			</a>
		</div>
	{:else if data.invitation && data.workspace}
		<!-- Invitation details -->
		<div class="space-y-6">
			<div class="text-center space-y-2">
				<p class="text-muted-foreground">You've been invited to join</p>
				<p class="text-2xl font-semibold">{data.workspace.workspaceName}</p>
			</div>

			<!-- Role badge -->
			<div class="bg-muted/50 rounded-lg p-4 space-y-2">
				<div class="flex items-center justify-center gap-2">
					<span class="text-sm text-muted-foreground">You'll join as:</span>
					<Badge variant="default" class="gap-1">
						<RoleIcon class="h-3 w-3" />
						{roleLabels[roleKey]}
					</Badge>
				</div>
				<p class="text-xs text-center text-muted-foreground">
					{roleDescriptions[roleKey]}
				</p>
			</div>

			<!-- Logged in as -->
			{#if data.user}
				<div class="text-center text-sm text-muted-foreground">
					Logged in as <span class="font-medium">{data.user.email}</span>
				</div>
			{/if}

			<!-- Form error -->
			{#if form?.error}
				<div class="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
					{form.error}
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex gap-3">
				<form method="POST" action="?/decline" use:enhance class="flex-1">
					<input type="hidden" name="code" value={data.invitation.invitationCode} />
					<Button type="submit" variant="outline" class="w-full" disabled={isSubmitting}>
						<X class="h-4 w-4 mr-2" />
						Decline
					</Button>
				</form>
				<form
					method="POST"
					action="?/accept"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
					class="flex-1"
				>
					<input type="hidden" name="code" value={data.invitation.invitationCode} />
					<Button type="submit" class="w-full" disabled={isSubmitting}>
						<Check class="h-4 w-4 mr-2" />
						{isSubmitting ? 'Accepting...' : 'Accept'}
					</Button>
				</form>
			</div>
		</div>
	{/if}
</div>
