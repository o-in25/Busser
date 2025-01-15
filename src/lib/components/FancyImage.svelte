<script lang="ts">
  import { onMount } from "svelte";
  import { POST } from "../../routes/(auth)/[slug]/+server";

  export let src: string;
  export let alt: string;
  export let divStyle: string =
    "rounded-lg border border-gray-200 dark:border-gray-700 divide-gray-200 dark:divide-gray-700 shadow-md flex w-full max-w-sm flex-col";
  export let imgStyle: string = "rounded-lg";

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
  <img class={imgStyle} {src} {alt} />
</div>
