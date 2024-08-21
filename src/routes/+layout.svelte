<script lang="ts">
  import "../app.css";
  import type { LayoutData } from "./$types";
  import {
    Navbar,
    NavBrand,
    NavHamburger,
    Dropdown,
    DropdownItem,
    DropdownHeader,
    DropdownDivider,
    NavLi,
    NavUl,
    Footer,
    FooterCopyright,
    Avatar,
    Toast,
    Heading,
  } from "flowbite-svelte";
  import logo from "$lib/assets/logo-nav.png";
  import Placeholder from "$lib/components/Placeholder.svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import MobileNav from "$lib/components/MobileNav.svelte";
  import { ProgressBar } from "@prgm/sveltekit-progress-bar";
    import { CheckCircleSolid, CloseCircleSolid } from "flowbite-svelte-icons";
    import Notification from "$lib/components/Notification.svelte";

  $: activeUrl = $page.url.pathname;
  // $: notification = $page.url.searchParams.has('notification');
  // $: notification, check()

  // function check() {
  //   console.log(notification)
  // }
  export let data: LayoutData;

  async function logout() {
    const response = await fetch("/logout", {
      method: "POST",
    });
    if (response.ok) {
      await invalidateAll();
      await goto(`/`);
    }
  }


</script>

<!-- desktop only -->
<div class="hidden sm:block">

  <!-- nav -->
  <Navbar color="default" class="mb-3">

    <!-- logo -->
    <NavBrand href="/">
      <img src={logo} class="me-3 h-12" alt="Flowbite Logo" />
      <span
        class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
      </span>
    </NavBrand>

    {#if data.user}
      <!-- avatar -->
      <div class="flex items-center md:order-2">
        <Placeholder id="avatar-menu" />
        <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
      </div>
      <!-- dropdown -->
      <Dropdown placement="right" triggeredBy="#avatar-menu" class="py-4">
        <DropdownHeader>
          <span class="block text-sm">{data.user.username}</span>
          <span class="block truncate text-sm font-medium">
            {data.user.email}
          </span>
        </DropdownHeader>
        <DropdownItem href="/settings">Settings</DropdownItem>
        <DropdownDivider />
        <DropdownItem on:click={logout}>
          {#if data.user}Log out{:else}Log In{/if}
        </DropdownItem>
      </Dropdown>
    {/if}

    <!-- tabs -->
    {#if data.user}
      <NavUl {activeUrl}>
        <NavLi href="/" active>Home</NavLi>
        <NavLi href="/inventory">Inventory</NavLi>
        <!-- <NavLi href="/spirits">Spirits</NavLi> -->
          <NavLi href="/tools">Tools</NavLi>
      </NavUl>
    {/if}

  </Navbar>
</div>


<!-- content -->
 <ProgressBar class="text-purple-600" />
<div class="container mx-auto p-4 flex-1">
  <slot />
</div>

<Notification></Notification>
<!-- svelte-ignore missing-declaration -->
<!-- <Toast color="green" position="top-right">
  <svelte:fragment slot="icon">
    <CheckCircleSolid  class="w-5 h-5" />
    <span class="sr-only">Error icon</span>
  </svelte:fragment>
  <div class="ms-3">
    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">New Notification</h4>
    <div class="text-sm font-normal text-gray-900 dark:text-white">Inventory item deleted.</div>
  </div>
</Toast> -->

<!-- footer -->
<div class="hidden sm:block md:mt-auto md:text-center">
  <Footer footerType="logo" class="rounded-none">
    <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
    <FooterCopyright by="Busser"/>
  </Footer>
</div>

<!-- mobile only -->
{#if data.user}
  <div class="sm:hidden mt-20">
    <MobileNav {activeUrl} />
  </div>
{/if}
