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
  } from "flowbite-svelte";
  import logo from "$lib/assets/logo-nav.png";
  import Placeholder from "$lib/components/Placeholder.svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from '$app/stores';
  $: activeUrl = $page.url.pathname;

  export let data: LayoutData;

  async function logout() {
    const response = await fetch("/logout", {
      method: "POST",
    });
    if (response.ok) {
      await invalidateAll();
      await goto(`/login`);
    }
  }
</script>
<Navbar color="form" class="mb-3">
  <NavBrand href="/">
    <img src={logo} class="me-3 h-12" alt="Flowbite Logo" />
    <span
      class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
    </span>
  </NavBrand>
  <div class="flex items-center md:order-2">
    <Placeholder id="avatar-menu" />
    <NavHamburger class1="w-full md:flex md:w-auto md:order-1" />
  </div>
  <Dropdown placement="bottom" triggeredBy="#avatar-menu">
    {#if data.user}
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
    {:else}
      <DropdownItem href="/login">Log In</DropdownItem>
    {/if}
  </Dropdown>
  {#if data.user}
    <NavUl {activeUrl}>
        <NavLi href="/" active>Home</NavLi>
        <NavLi href="/inventory">Inventory</NavLi>
        <!-- <NavLi href="/spirits">Spirits</NavLi>
        <NavLi href="/tools">Tools</NavLi> -->
    </NavUl>
  {/if}
</Navbar>

<div class="container mx-auto flex flex-col min-h-screen">
  <div class="flex-1">
    <slot/>
  </div>
  <Footer footerType="logo" class="">
    <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
    <FooterCopyright href="/" by="Busser" />
  </Footer>
</div>



<style lang="postcss"></style>
