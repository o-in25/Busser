<script lang="ts">
	import { ArrowRight, Bot, SendHorizonal, Sparkles } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import RecipeProposalCard from '$lib/components/RecipeProposalCard.svelte';

	import type { RecipeProposal } from '$lib/types/assistant';

	interface Props {
		userAvatarUrl?: string;
	}

	let { userAvatarUrl }: Props = $props();

	type DisplayMessage = {
		role: 'user' | 'assistant';
		content: string;
		proposal?: RecipeProposal | null;
	};

	let messages: DisplayMessage[] = $state([]);
	let input = $state('');
	let isLoading = $state(false);
	let isStreaming = $state(false);
	let isConfirming = $state(false);
	let chatContainer: HTMLDivElement | undefined = $state();
	let textareaEl: HTMLTextAreaElement | undefined = $state();

	function scrollToBottom() {
		if (chatContainer) {
			requestAnimationFrame(() => {
				chatContainer!.scrollTop = chatContainer!.scrollHeight;
			});
		}
	}

	function autoResize() {
		if (textareaEl) {
			textareaEl.style.height = 'auto';
			textareaEl.style.height = Math.min(textareaEl.scrollHeight, 120) + 'px';
		}
	}

	async function sendMessage() {
		const text = input.trim();
		if (!text || isLoading) return;

		input = '';
		if (textareaEl) textareaEl.style.height = 'auto';
		messages.push({ role: 'user', content: text });
		scrollToBottom();

		isLoading = true;
		isStreaming = true;

		const apiMessages = messages
			.filter((m) => !m.proposal)
			.map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			}));

		messages.push({ role: 'assistant', content: '' });
		const assistantIndex = messages.length - 1;

		try {
			const response = await fetch('/api/assistant/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: apiMessages }),
			});

			if (!response.ok) {
				throw new Error(`Request failed: ${response.status}`);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No response body');

			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (!line.startsWith('data: ')) continue;
					const data = line.slice(6);

					try {
						const event = JSON.parse(data);

						if (event.type === 'text') {
							messages[assistantIndex].content += event.content;
							scrollToBottom();
						} else if (event.type === 'proposal') {
							messages[assistantIndex].proposal = event.data as RecipeProposal;
							scrollToBottom();
						} else if (event.type === 'error') {
							messages[assistantIndex].content = 'Sorry, something went wrong. Please try again.';
						}
					} catch {
						// invalid JSON line, skip
					}
				}
			}
		} catch (err: any) {
			messages[assistantIndex].content = 'Sorry, I encountered an error. Please try again.';
			console.error('Chat error:', err);
		} finally {
			isLoading = false;
			isStreaming = false;
			scrollToBottom();
		}
	}

	async function confirmProposal(proposal: RecipeProposal, messageIndex: number) {
		isConfirming = true;

		try {
			const response = await fetch('/api/assistant/confirm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ proposal }),
			});

			const result = await response.json();

			messages[messageIndex].proposal = null;

			if (result.status === 'success') {
				messages.push({
					role: 'assistant',
					content: `"${proposal.recipeName}" has been created successfully! You can find it in your recipe catalog.${
						result.data?.createdProducts?.length
							? ` I also added ${result.data.createdProducts.length} new ingredient(s) to your inventory.`
							: ''
					}`,
				});
			} else {
				messages.push({
					role: 'assistant',
					content: `Sorry, there was an error creating the recipe: ${result.error || 'Unknown error'}. Please try again.`,
				});
			}
		} catch (err: any) {
			messages[messageIndex].proposal = null;
			messages.push({
				role: 'assistant',
				content: 'Sorry, there was an error creating the recipe. Please try again.',
			});
			console.error('Confirm error:', err);
		} finally {
			isConfirming = false;
			scrollToBottom();
		}
	}

	function cancelProposal(messageIndex: number) {
		messages[messageIndex].proposal = null;
		messages.push({
			role: 'assistant',
			content:
				"No problem, I've cancelled that recipe. Let me know if you'd like to make any changes or try a different recipe.",
		});
		scrollToBottom();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<div class="flex flex-col h-full">
	<!-- messages -->
	<div class="flex-1 overflow-y-auto space-y-4 p-4" bind:this={chatContainer}>
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-center px-4">
				<!-- icon -->
				<div class="relative mb-4 animate-chat-fade-up">
					<div
						class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20"
					>
						<Sparkles class="h-7 w-7 text-white" />
					</div>
				</div>

				<!-- headline -->
				<h2
					class="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-chat-fade-up"
					style="animation-delay: 80ms"
				>
					What are we making?
				</h2>
				<p
					class="text-muted-foreground text-sm mt-1 max-w-xs animate-chat-fade-up"
					style="animation-delay: 140ms"
				>
					Describe a cocktail and I'll build the recipe, check your inventory, and add it to your
					catalog.
				</p>

				<!-- suggestion chips (staggered entrance) -->
				<div class="mt-5 flex flex-col gap-2 w-full max-w-sm">
					{#each [{ label: 'Classic Negroni', prompt: 'Add a recipe for a Negroni' }, { label: 'Margarita with a specific tequila', prompt: 'Add a Margarita using Codigo 1530 Blanco' }, { label: 'Custom recipe from ingredients', prompt: 'Add this recipe: 2oz bourbon, 1oz sweet vermouth, 2 dashes Angostura bitters' }] as suggestion, idx}
						<button
							class="group glass-surface flex items-center gap-3 text-left px-4 py-2.5 hover:bg-white/75 dark:hover:bg-zinc-700/50 hover:border-primary/30 transition-all cursor-pointer animate-chat-fade-up"
							style="animation-delay: {220 + idx * 80}ms"
							onclick={() => {
								input = suggestion.prompt;
								sendMessage();
							}}
						>
							<span
								class="flex-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors"
								>{suggestion.label}</span
							>
							<ArrowRight
								class="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors"
							/>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#each messages as message, i}
			{#if message.content && !message.proposal}
				<div class="animate-chat-bubble">
					<ChatMessage
						role={message.role}
						content={message.content}
						isStreaming={isStreaming && i === messages.length - 1 && message.role === 'assistant'}
						{userAvatarUrl}
					/>
				</div>
			{/if}

			{#if message.proposal}
				<div class="animate-chat-card">
					<RecipeProposalCard
						proposal={message.proposal}
						onconfirm={() => confirmProposal(message.proposal!, i)}
						oncancel={() => cancelProposal(i)}
						{isConfirming}
					/>
				</div>
			{/if}
		{/each}

		<!-- typing indicator -->
		{#if isLoading && messages[messages.length - 1]?.content === '' && messages[messages.length - 1]?.role === 'assistant'}
			<div class="flex gap-3 animate-chat-bubble">
				<div
					class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
				>
					<Bot class="h-4 w-4 text-primary" />
				</div>
				<div class="glass-surface px-4 py-3 rounded-2xl rounded-bl-md">
					<div class="flex gap-1.5 items-center h-5">
						<span
							class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-typing-dot"
						></span>
						<span
							class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-typing-dot"
							style="animation-delay: 0.15s"
						></span>
						<span
							class="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-typing-dot"
							style="animation-delay: 0.3s"
						></span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- input bar -->
	<div
		class="p-3 border-t border-white/20 dark:border-zinc-700/30 backdrop-blur-sm bg-white/30 dark:bg-zinc-900/30"
	>
		<form
			class="flex gap-2 items-end"
			onsubmit={(e) => {
				e.preventDefault();
				sendMessage();
			}}
		>
			<textarea
				bind:this={textareaEl}
				bind:value={input}
				oninput={autoResize}
				onkeydown={handleKeydown}
				placeholder="Describe a cocktail to add..."
				rows={1}
				disabled={isLoading}
				class="glass-input flex-1 resize-none px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
			></textarea>
			<Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
				<SendHorizonal class="h-4 w-4" />
			</Button>
		</form>
	</div>
</div>

