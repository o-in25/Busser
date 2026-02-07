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

		// build conversation history for API
		const apiMessages = messages
			.filter((m) => !m.proposal)
			.map((m) => ({
				role: m.role as 'user' | 'assistant',
				content: m.content,
			}));

		// add streaming assistant message
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

				// process SSE lines
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
							// proposal data received directly from server
							messages[assistantIndex].proposal = event.data as RecipeProposal;
							scrollToBottom();
						} else if (event.type === 'error') {
							messages[assistantIndex].content =
								'Sorry, something went wrong. Please try again.';
						}
					} catch {
						// invalid JSON line, skip
					}
				}
			}
		} catch (err: any) {
			messages[assistantIndex].content =
				'Sorry, I encountered an error. Please try again.';
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

			// remove proposal from message
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

<div class="flex flex-col h-[min(500px,65vh)]">
	<!-- Messages -->
	<div class="flex-1 overflow-y-auto space-y-4 p-4" bind:this={chatContainer}>
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-center px-4">
				<!-- Icon -->
				<div class="relative mb-4">
					<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
						<Sparkles class="h-7 w-7 text-white" />
					</div>
				</div>

				<!-- Headline -->
				<h2 class="text-lg font-semibold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
					What are we making?
				</h2>
				<p class="text-muted-foreground text-sm mt-1 max-w-xs">
					Describe a cocktail and I'll build the recipe, check your inventory, and add it to your catalog.
				</p>

				<!-- Prompt suggestions -->
				<div class="mt-5 flex flex-col gap-2 w-full max-w-sm">
					{#each [
						{ label: 'Classic Negroni', prompt: 'Add a recipe for a Negroni' },
						{ label: 'Margarita with a specific tequila', prompt: 'Add a Margarita using Codigo 1530 Blanco' },
						{ label: 'Custom recipe from ingredients', prompt: 'Add this recipe: 2oz bourbon, 1oz sweet vermouth, 2 dashes Angostura bitters' },
					] as suggestion}
						<button
							class="group flex items-center gap-3 text-left px-4 py-2.5 rounded-xl border border-border/50 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all cursor-pointer"
							onclick={() => {
								input = suggestion.prompt;
								sendMessage();
							}}
						>
							<span class="flex-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">{suggestion.label}</span>
							<ArrowRight class="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-violet-500 transition-colors" />
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#each messages as message, i}
			{#if message.content && !message.proposal}
				<ChatMessage
					role={message.role}
					content={message.content}
					isStreaming={isStreaming && i === messages.length - 1 && message.role === 'assistant'}
					{userAvatarUrl}
				/>
			{/if}

			{#if message.proposal}
				<RecipeProposalCard
					proposal={message.proposal}
					onconfirm={() => confirmProposal(message.proposal!, i)}
					oncancel={() => cancelProposal(i)}
					{isConfirming}
				/>
			{/if}
		{/each}

		<!-- Typing indicator -->
		{#if isLoading && messages[messages.length - 1]?.content === '' && messages[messages.length - 1]?.role === 'assistant'}
			<div class="flex gap-3">
				<div class="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
					<Bot class="h-4 w-4 text-violet-500" />
				</div>
				<div class="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
					<div class="flex gap-1 items-center">
						<span class="w-2 h-2 rounded-full bg-muted-foreground/40 animate-[typing_1.4s_ease-in-out_infinite]"></span>
						<span class="w-2 h-2 rounded-full bg-muted-foreground/40 animate-[typing_1.4s_ease-in-out_0.2s_infinite]"></span>
						<span class="w-2 h-2 rounded-full bg-muted-foreground/40 animate-[typing_1.4s_ease-in-out_0.4s_infinite]"></span>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Input -->
	<div class="border-t p-3">
		<form class="flex gap-2 items-end" onsubmit={(e) => { e.preventDefault(); sendMessage(); }}>
			<textarea
				bind:this={textareaEl}
				bind:value={input}
				oninput={autoResize}
				onkeydown={handleKeydown}
				placeholder="Describe a cocktail to add..."
				rows={1}
				disabled={isLoading}
				class="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
			></textarea>
			<Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
				<SendHorizonal class="h-4 w-4" />
			</Button>
		</form>
	</div>
</div>

<style>
	@keyframes typing {
		0%, 60%, 100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		30% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
