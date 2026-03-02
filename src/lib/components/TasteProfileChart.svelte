<script lang="ts">
	const { sweetness, dryness, strength, versatility }: {
		sweetness: number;
		dryness: number;
		strength: number;
		versatility: number;
	} = $props();

	const cx = 130;
	const cy = 130;
	const maxR = 80;
	const rings = [27, 53, 80];

	function point(angle: number, value: number): string {
		const r = (value / 10) * maxR;
		const rad = (angle - 90) * (Math.PI / 180);
		return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`;
	}

	function pointXY(angle: number, value: number): { x: number; y: number } {
		const r = (value / 10) * maxR;
		const rad = (angle - 90) * (Math.PI / 180);
		return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
	}

	const polygon = $derived(
		[
			point(0, sweetness),
			point(90, strength),
			point(180, dryness),
			point(270, versatility),
		].join(' ')
	);

	const axes = [
		{ angle: 0, label: 'Sweet', value: sweetness },
		{ angle: 90, label: 'Strong', value: strength },
		{ angle: 180, label: 'Dry', value: dryness },
		{ angle: 270, label: 'Versatile', value: versatility },
	];

	const dominant = $derived.by(() => {
		const entries = [
			{ label: 'Sweet', value: sweetness },
			{ label: 'Strong', value: strength },
			{ label: 'Dry', value: dryness },
			{ label: 'Versatile', value: versatility },
		];
		return entries.reduce((a, b) => (b.value > a.value ? b : a));
	});

	// label positioning with proper offsets to stay inside viewBox
	function labelPos(angle: number): { x: number; y: number; anchor: string } {
		const r = maxR + 22;
		const rad = (angle - 90) * (Math.PI / 180);
		const x = cx + r * Math.cos(rad);
		const y = cy + r * Math.sin(rad);
		let anchor = 'middle';
		if (angle === 90) anchor = 'start';
		else if (angle === 270) anchor = 'end';
		return { x, y, anchor };
	}
</script>

<div class="space-y-4">
	<!-- radar chart -->
	<div class="w-full max-w-[240px] mx-auto">
		<svg viewBox="0 0 260 260" class="w-full h-full" aria-label="Taste profile radar chart">
			<defs>
				<radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
					<stop offset="0%" stop-color="hsl(var(--primary))" stop-opacity="0.5" />
					<stop offset="100%" stop-color="hsl(var(--primary))" stop-opacity="0.1" />
				</radialGradient>
				<filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="3" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<!-- guide rings -->
			{#each rings as r}
				<circle {cx} {cy} {r} fill="none" stroke="currentColor" stroke-opacity="0.08" stroke-width="0.5" />
			{/each}

			<!-- axis lines -->
			{#each axes as axis}
				{@const end = pointXY(axis.angle, 10)}
				<line
					x1={cx}
					y1={cy}
					x2={end.x}
					y2={end.y}
					stroke="currentColor"
					stroke-opacity="0.12"
					stroke-width="0.5"
				/>
			{/each}

			<!-- data polygon with glow -->
			<polygon
				points={polygon}
				fill="url(#radar-fill)"
				stroke="hsl(var(--primary))"
				stroke-width="1.5"
				stroke-linejoin="round"
				filter="url(#radar-glow)"
			/>

			<!-- data points -->
			{#each axes as axis}
				{@const p = pointXY(axis.angle, axis.value)}
				<circle
					cx={p.x}
					cy={p.y}
					r="3.5"
					fill="hsl(var(--primary))"
					stroke="hsl(var(--background))"
					stroke-width="1.5"
				/>
			{/each}

			<!-- labels -->
			{#each axes as axis}
				{@const pos = labelPos(axis.angle)}
				<text
					x={pos.x}
					y={axis.angle === 180 ? pos.y + 2 : axis.angle === 0 ? pos.y - 2 : pos.y}
					text-anchor={pos.anchor}
					dominant-baseline={axis.angle === 0 ? 'auto' : axis.angle === 180 ? 'hanging' : 'central'}
					class="fill-muted-foreground text-[10px] font-medium"
				>
					{axis.label}
				</text>
				<text
					x={pos.x}
					y={axis.angle === 180 ? pos.y + 14 : axis.angle === 0 ? pos.y - 14 : pos.y + 12}
					text-anchor={pos.anchor}
					dominant-baseline={axis.angle === 0 ? 'auto' : 'hanging'}
					class="fill-foreground text-[9px] font-bold"
				>
					{axis.value.toFixed(1)}
				</text>
			{/each}
		</svg>
	</div>

	<!-- stat bars -->
	<div class="space-y-2.5 px-1">
		{#each axes as axis}
			<div class="flex items-center gap-3">
				<span class="text-[11px] text-muted-foreground w-16 shrink-0">{axis.label}</span>
				<div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
					<div
						class="h-full rounded-full bg-primary transition-all duration-500"
						class:!bg-neon-cyan-500={axis.label === dominant.label}
						style="width: {(axis.value / 10) * 100}%"
					></div>
				</div>
				<span class="text-[11px] font-semibold w-7 text-right tabular-nums">{axis.value.toFixed(1)}</span>
			</div>
		{/each}
	</div>

	<!-- dominant trait callout -->
	<div class="flex items-center justify-center gap-2 pt-2 border-t border-border/50">
		<span class="text-xs text-muted-foreground">Dominant trait</span>
		<span class="text-xs font-bold text-neon-cyan-500">{dominant.label}</span>
		<span class="text-[10px] text-muted-foreground">({dominant.value.toFixed(1)}/10)</span>
	</div>
</div>
