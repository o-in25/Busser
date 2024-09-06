<script lang="ts">
  import "../app.css";
  import type { LayoutData } from "./$types";
  import {
    Footer,
    FooterCopyright,
  } from "flowbite-svelte";
  import { page } from "$app/stores";
  import { ProgressBar } from "@prgm/sveltekit-progress-bar";
  import Notification from "$lib/components/Notification.svelte";
  import Nav from "$lib/components/Nav.svelte";

  export let data: LayoutData;

  $: activeUrl = $page.url.pathname;
  $: user = data.user;

</script>

<!-- top nav -->
<Nav {activeUrl} {user}></Nav>

<!-- loading bar -->
<ProgressBar class="text-purple-600" />

<!-- page -->
<div class="container mx-auto p-4 flex-1">
  <slot />
</div>

<!-- toast -->
<Notification/>

<!-- footer -->
<div class="hidden sm:block md:mt-auto md:text-center">
  <Footer footerType="logo" class="rounded-none">
    <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
    <FooterCopyright by="Busser" />
  </Footer>
</div>
