<script>
	export let name;
	export let href;
</script>

<nav
	class="flex"
	aria-label="Breadcrumb"
>
	<ol
		class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse"
	>
		<li class="inline-flex items-center">
			<a
				{href}
				class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
			>
				{name}
			</a>
		</li>
		<slot />
	</ol>
</nav>
