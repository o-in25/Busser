<script lang="ts">
	import { Toaster as Sonner, type ToasterProps } from 'svelte-sonner';

	let { class: className, ...restProps }: ToasterProps & { class?: string } = $props();
</script>

<Sonner
	class={className}
	toastOptions={{
		classes: {
			toast:
				'group toast group-[.toaster]:!rounded-full group-[.toaster]:px-5 group-[.toaster]:py-3 group-[.toaster]:backdrop-blur-xl group-[.toaster]:backdrop-saturate-150 group-[.toaster]:bg-white/70 group-[.toaster]:dark:bg-zinc-900/60 group-[.toaster]:border group-[.toaster]:border-white/30 group-[.toaster]:dark:border-white/10 group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/5 group-[.toaster]:dark:shadow-black/30 group-[.toaster]:text-foreground',
			description: 'group-[.toast]:text-muted-foreground',
			actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
			cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
			success: 'group-[.toaster]:!border-neon-green-500/30',
			error: 'group-[.toaster]:!border-red-500/30',
		},
	}}
	{...restProps}
/>
