<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<!-- stat cards row -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
	{#each Array(4) as _}
		<div class="rounded-xl border p-4">
			<Skeleton class="h-4 w-20 mb-2" />
			<Skeleton class="h-8 w-16" />
		</div>
	{/each}
</div>

<!-- toolbar -->
<div class="flex items-center gap-2 mb-6">
	<Skeleton class="h-10 flex-1 rounded-lg" />
	<Skeleton class="h-10 w-10 rounded-lg" />
	<Skeleton class="h-10 w-10 rounded-lg" />
	<Skeleton class="h-10 w-24 rounded-lg" />
</div>

<!-- results count -->
<Skeleton class="h-4 w-48 mb-4" />

<!-- table rows -->
<div class="rounded-xl border overflow-hidden">
	<div class="border-b px-4 py-3">
		<Skeleton class="h-4 w-full" />
	</div>
	{#each Array(8) as _}
		<div class="flex items-center gap-4 px-4 py-3 border-b last:border-b-0">
			<Skeleton class="h-4 w-4 rounded" />
			<Skeleton class="h-10 w-10 rounded-lg shrink-0" />
			<Skeleton class="h-4 flex-1" />
			<Skeleton class="h-4 w-20" />
			<Skeleton class="h-6 w-16 rounded-full" />
		</div>
	{/each}
</div>
