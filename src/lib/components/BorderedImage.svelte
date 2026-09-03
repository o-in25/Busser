<script lang="ts">
	import { cdnSrc, cdnSrcset } from '$lib/utils/image';

	let {
		src,
		alt,
		divStyle = 'rounded-lg border border-gray-700 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 shadow-md flex w-full max-w-sm flex-col',
		imgStyle = 'rounded-lg',
	}: {
		src: string;
		alt: string;
		divStyle?: string;
		imgStyle?: string;
	} = $props();
</script>

<div class={divStyle}>
	<img
		class={imgStyle}
		src={cdnSrc(src, 640)}
		srcset={cdnSrcset(src, [384, 640, 768])}
		sizes="(max-width: 640px) 100vw, 384px"
		{alt}
		loading="lazy"
	/>
</div>
