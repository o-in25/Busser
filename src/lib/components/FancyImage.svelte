<script lang="ts">
	import { cdnSrc, cdnSrcset } from '$lib/utils/image';

	export let src: string;
	export let alt: string;
	export let divStyle: string =
		'rounded-lg border border-gray-700 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 shadow-md flex w-full max-w-sm flex-col';
	export let imgStyle: string = 'rounded-lg';

	// const getSignedUrl = async (unsignedUrl) => {
	//   let data = await fetch(`/storage/get-signed-url`, {
	//     method: "POST",
	//     body: JSON.stringify({ unsignedUrl }),
	//   });
	//   let { signed } = await data.json();
	//   return signed;
	// };

	// onMount(() => {
	//   if(isUnsigned && unsignedUrl) {
	//     getSignedUrl(unsignedUrl).then((signed) => {
	//       signedUrl = signed;
	//     });
	//   }
	// });
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
