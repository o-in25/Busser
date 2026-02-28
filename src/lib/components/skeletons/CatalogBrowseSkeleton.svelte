<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<!-- header -->
<div class="container mx-auto px-4 mt-4">
	<div class="flex items-center gap-4 mb-6">
		<Skeleton class="h-10 w-10 rounded-lg" />
		<div>
			<Skeleton class="h-7 w-48 mb-2" />
			<Skeleton class="h-4 w-36" />
		</div>
	</div>

	<!-- toolbar -->
	<div class="flex items-center gap-2 mb-6">
		<Skeleton class="h-10 flex-1 rounded-lg" />
		<Skeleton class="h-10 w-10 rounded-lg" />
		<Skeleton class="h-10 w-10 rounded-lg" />
		<Skeleton class="h-10 w-24 rounded-lg" />
	</div>

	<!-- recipe grid -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		{#each Array(8) as _}
			<div class="rounded-xl border overflow-hidden">
				<Skeleton class="h-44 w-full rounded-none" />
				<div class="p-4">
					<Skeleton class="h-5 w-3/4 mb-2" />
					<Skeleton class="h-4 w-full mb-1" />
					<Skeleton class="h-4 w-2/3" />
				</div>
			</div>
		{/each}
	</div>
</div>
