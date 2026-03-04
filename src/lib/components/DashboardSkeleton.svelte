<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<!-- welcome header -->
<section class="mb-8 mt-4">
	<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
			<Skeleton class="h-9 w-72 mb-2" />
			<Skeleton class="h-5 w-64" />
		</div>
		<div class="grid grid-cols-2 gap-3 w-full md:w-auto md:flex">
			<div class="rounded-xl border px-4 py-3">
				<div class="flex items-center gap-3">
					<Skeleton class="h-9 w-9 rounded-full" />
					<div>
						<Skeleton class="h-7 w-10 mb-1" />
						<Skeleton class="h-3 w-16" />
					</div>
				</div>
			</div>
			<div class="rounded-xl border px-4 py-3">
				<div class="flex items-center gap-3">
					<Skeleton class="h-9 w-9 rounded-full" />
					<div>
						<Skeleton class="h-7 w-10 mb-1" />
						<Skeleton class="h-3 w-16" />
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- quick actions -->
<section class="mb-8">
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		{#each Array(4) as _}
			<div class="rounded-xl border p-4">
				<div class="flex items-center gap-3">
					<Skeleton class="h-9 w-9 rounded-lg" />
					<div>
						<Skeleton class="h-4 w-24 mb-1" />
						<Skeleton class="h-3 w-16" />
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- recipe grid placeholder -->
<section class="mb-8">
	<Skeleton class="h-7 w-40 mb-2" />
	<Skeleton class="h-4 w-64 mb-4" />
	<div class="flex gap-2 mb-4">
		{#each Array(4) as _}
			<Skeleton class="h-8 w-20 rounded-full" />
		{/each}
	</div>
	<div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each Array(8) as _}
			<div class="rounded-xl border overflow-hidden">
				<Skeleton class="aspect-square w-full rounded-none" />
				<div class="p-3">
					<Skeleton class="h-4 w-3/4 mb-1" />
					<Skeleton class="h-3 w-full" />
				</div>
			</div>
		{/each}
	</div>
</section>
