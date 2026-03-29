<script lang="ts">
	import type { Snippet } from 'svelte';

	import logoImg from '$lib/assets/logo.png';

	let {
		children,
		logo = false,
		logoSize = 'md',
		class: className = '',
	}: {
		children: Snippet;
		logo?: boolean;
		logoSize?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	const logoSizeClass = {
		sm: 'h-16 md:h-20',
		md: 'h-24 md:h-32',
		lg: 'h-40 md:h-52 lg:h-60',
	};
</script>

<div class="relative overflow-hidden {className}">
	<!-- animated background gradient -->
	<div class="absolute inset-0 hero-gradient -z-10"></div>
	<div class="absolute inset-0 bg-grid-pattern opacity-5 -z-10"></div>

	<!-- floating orbs -->
	<div class="hero-orbs">
		<div class="hero-orb hero-orb-purple"></div>
		<div class="hero-orb hero-orb-pink"></div>
		<div class="hero-orb hero-orb-orange"></div>
	</div>

	<div class="relative z-10">
		{#if logo}
			<div class="flex justify-center">
				<a href="/" class="hover:opacity-80 transition-opacity">
					<img src={logoImg} alt="Busser" class="{logoSizeClass[logoSize]} hero-logo-glow" />
				</a>
			</div>
		{/if}
		{@render children()}
	</div>
</div>

<style>
	.hero-gradient {
		background: linear-gradient(
			135deg,
			rgba(165, 125, 213, 0.1),
			rgba(248, 78, 128, 0.05),
			rgba(232, 163, 15, 0.1),
			rgba(165, 125, 213, 0.08)
		);
		background-size: 200% 200%;
		animation: hero-shift 8s ease infinite;
	}

	@keyframes hero-shift {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}

	.hero-orbs {
		position: absolute;
		inset: 0;
		z-index: -5;
		pointer-events: none;
	}

	.hero-orb {
		position: absolute;
		width: 14rem;
		height: 14rem;
		border-radius: 9999px;
		opacity: 0.2;
		filter: blur(48px);
	}

	.hero-orb-purple {
		top: 5%;
		left: 10%;
		background: rgba(165, 125, 213, 0.6);
		animation: hero-float-1 12s ease-in-out infinite;
	}

	.hero-orb-pink {
		top: 30%;
		right: 10%;
		background: rgba(248, 78, 128, 0.6);
		animation: hero-float-2 16s ease-in-out infinite;
	}

	.hero-orb-orange {
		bottom: 10%;
		left: 20%;
		background: rgba(232, 163, 15, 0.6);
		animation: hero-float-3 14s ease-in-out infinite;
	}

	@keyframes hero-float-1 {
		0%, 100% { transform: translate(0, 0); }
		33% { transform: translate(30px, -20px); }
		66% { transform: translate(-20px, 15px); }
	}

	@keyframes hero-float-2 {
		0%, 100% { transform: translate(0, 0); }
		33% { transform: translate(-25px, 20px); }
		66% { transform: translate(15px, -25px); }
	}

	@keyframes hero-float-3 {
		0%, 100% { transform: translate(0, 0); }
		33% { transform: translate(20px, 15px); }
		66% { transform: translate(-30px, -10px); }
	}

	/* logo glow animation */
	.hero-logo-glow {
		animation: hero-glow 3s ease-in-out infinite;
	}

	@keyframes hero-glow {
		0%, 100% {
			filter: drop-shadow(0 0 8px rgba(165, 125, 213, 0.3));
		}
		50% {
			filter: drop-shadow(0 0 24px rgba(248, 78, 128, 0.5));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-gradient { animation: none; }
		.hero-orb { animation-play-state: paused; }
		.hero-logo-glow { animation: none; filter: drop-shadow(0 0 8px rgba(165, 125, 213, 0.3)); }
	}
</style>
