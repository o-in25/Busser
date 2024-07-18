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
    FooterLink,
    FooterLinkGroup,
    FooterBrand,
    BottomNav,
    BottomNavItem,
  } from "flowbite-svelte";
  import logo from "$lib/assets/logo-nav.png";
  import Placeholder from "$lib/components/Placeholder.svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from '$app/stores';
    import { HomeSolid, WalletSolid, AdjustmentsVerticalOutline, UserCircleSolid } from "flowbite-svelte-icons";
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
<div class="hidden sm:block">
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
    <Dropdown placement="bottom" triggeredBy="#avatar-menu" class="py-4">
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
</div>

<div class="container mx-auto p-4">
  <slot/>
</div>

<Footer footerType="logo">
  <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
  <FooterCopyright by="Busser" />
</Footer>

<div class="sm:hidden mt-20 group">
<BottomNav position="fixed" navType="application" classInner="grid-cols-5" {activeUrl} outerClass="w-full z-50 border-gray-200 dark:bg-transparent backdrop-blur-xl">
  <BottomNavItem btnName="Home" appBtnPosition="left" href="/" activeClass="dark:hover:bg-red-300">
    <HomeSolid class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
  </BottomNavItem>
  <BottomNavItem btnName="Wallet" appBtnPosition="middle" href="/inventory" >
    <WalletSolid class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
  </BottomNavItem>
  <div class="flex items-center justify-center">
    <BottomNavItem btnName="Create new item" appBtnPosition="middle" btnClass="inline-flex items-center justify-center w-10 h-10 font-medium bg-primary-600 rounded-full hover:bg-primary-700 group focus:ring-4 focus:ring-primary-300 focus:outline-none dark:focus:ring-primary-800">
    </BottomNavItem>
  </div>
  <BottomNavItem btnName="Settings" appBtnPosition="middle">
    <AdjustmentsVerticalOutline class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
  </BottomNavItem>
  <BottomNavItem btnName="Profile" appBtnPosition="right">
    <UserCircleSolid class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-500" />
  </BottomNavItem>
</BottomNav>
</div>


<style lang="sass">


</style>
