<script lang="ts">
	import { LogIn, Mail } from 'lucide-svelte';

	import logo from '$lib/assets/logo.png';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let {
		title,
		description,
	}: {
		title: string;
		description: string;
	} = $props();
</script>

<section class="relative overflow-hidden py-12 md:py-18 rounded-2xl mt-4">
	<!-- animated background gradient -->
	<div class="absolute inset-0 gateway-gradient -z-10 rounded-2xl"></div>
	<div class="absolute inset-0 bg-grid-pattern opacity-5 -z-10"></div>

	<!-- floating orbs -->
	<div class="gateway-orbs">
		<div class="gateway-orb gateway-orb-purple"></div>
		<div class="gateway-orb gateway-orb-pink"></div>
		<div class="gateway-orb gateway-orb-orange"></div>
	</div>

	<div class="max-w-2xl mx-auto text-center px-4">
		<img
			src={logo}
			alt="Busser"
			class="h-24 md:h-32 mx-auto mb-6 drop-shadow-lg"
		/>

		<h1
			class="text-3xl md:text-4xl font-extrabold mb-4 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 via-primary-500 to-neon-amber-500"
		>
			{title}
		</h1>

		<p class="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
			{description}
		</p>

		<div class="flex flex-col sm:flex-row justify-center gap-4">
			<a class={cn(buttonVariants({ size: 'lg' }), 'text-lg px-8')} href="/signup">
				<Mail class="w-5 h-5 mr-2" />
				Sign Up Free
			</a>
			<a
				class={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'text-lg px-8')}
				href="/login"
			>
				<LogIn class="w-5 h-5 mr-2" />
				Log In
			</a>
		</div>
	</div>
</section>

<style>
	.gateway-gradient {
		background: linear-gradient(
			135deg,
			rgba(165, 125, 213, 0.1),
			rgba(248, 78, 128, 0.05),
			rgba(232, 163, 15, 0.1),
			rgba(165, 125, 213, 0.08)
		);
		background-size: 200% 200%;
		animation: gateway-shift 8s ease infinite;
	}

	@keyframes gateway-shift {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}

	.gateway-orbs {
		position: absolute;
		inset: 0;
		z-index: -5;
		pointer-events: none;
	}

	.gateway-orb {
		position: absolute;
		width: 14rem;
		height: 14rem;
		border-radius: 9999px;
		opacity: 0.2;
		filter: blur(48px);
	}

	.gateway-orb-purple {
		top: 5%;
		left: 10%;
		background: rgba(165, 125, 213, 0.6);
		animation: gw-float-1 12s ease-in-out infinite;
	}

	.gateway-orb-pink {
		top: 30%;
		right: 10%;
		background: rgba(248, 78, 128, 0.6);
		animation: gw-float-2 16s ease-in-out infinite;
	}

	.gateway-orb-orange {
		bottom: 10%;
		left: 20%;
		background: rgba(232, 163, 15, 0.6);
		animation: gw-float-3 14s ease-in-out infinite;
	}

	@keyframes gw-float-1 {
		0%, 100% { transform: translate(0, 0); }
		33% { transform: translate(30px, -20px); }
		66% { transform: translate(-20px, 15px); }
	}

	@keyframes gw-float-2 {
		0%, 100% { transform: translate(0, 0); }
		33% { transform: translate(-25px, 20px); }
		66% { transform: translate(15px, -25px); }
	}

	@keyframes gw-float-3 {
		0%, 100% { transform: translate(0, 0); }
		33% { transform: translate(20px, 15px); }
		66% { transform: translate(-30px, -10px); }
	}

	@media (prefers-reduced-motion: reduce) {
		.gateway-gradient { animation: none; }
		.gateway-orb { animation-play-state: paused; }
	}
</style>
