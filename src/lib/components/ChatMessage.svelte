<script lang="ts">
	import { Bot, User } from 'lucide-svelte';

	interface Props {
		role: 'user' | 'assistant';
		content: string;
		isStreaming?: boolean;
		userAvatarUrl?: string;
	}

	let { role, content, isStreaming = false, userAvatarUrl }: Props = $props();
</script>

<div class="flex gap-3 {role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
	<div class="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
		{#if role === 'user'}
			{#if userAvatarUrl}
				<img src={userAvatarUrl} alt="You" class="w-full h-full object-cover" />
			{:else}
				<div class="w-full h-full bg-primary/10 flex items-center justify-center">
					<User class="h-4 w-4 text-muted-foreground" />
				</div>
			{/if}
		{:else}
			<div class="w-full h-full bg-violet-500/10 flex items-center justify-center">
				<Bot class="h-4 w-4 text-violet-500" />
			</div>
		{/if}
	</div>
	<div
		class="flex-1 max-w-[85%] rounded-2xl px-4 py-2.5 text-sm {role === 'user'
			? 'bg-primary text-primary-foreground rounded-br-md'
			: 'bg-muted rounded-bl-md'}"
	>
		<p class="whitespace-pre-wrap">{content}{#if isStreaming}<span
					class="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm"
				></span>{/if}</p>
	</div>
</div>
