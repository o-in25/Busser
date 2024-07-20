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
    import MobileNav from "$lib/components/MobileNav.svelte";
  $: activeUrl = $page.url.pathname;
      import { ProgressBar } from "@prgm/sveltekit-progress-bar";

  let svgClass = `
    mb-1 
    text-gray-500 
    dark:text-gray-400 
    group-hover:text-gray-600 
    dark:group-hover:text-gray-500
  `;
  let svgActiveClass = `
    mb-1 
    text-primary-500 
    dark:text-primary-500 
    group-hover:text-primary-700 
    dark:group-hover:text-primary-700
  `;

  //dark:hover:bg-gray-800 group 
  let oneTime = `
    hover:bg-gray-50 
    dark:bg-gray-800 
    text-primary-700 

    dark:text-primary-700 
    text-primary-900 
    dark:text-primary-900"
  `;


  
  let currentTab = `group inline-flex flex-col items-center justify-center px-5 hover:bg-red-50 dark:hover:bg-red-800 group text-primary-700 dark:text-primary-700 hover:text-primary-900 dark:hover:text-primary-900`
  
  
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
  <!-- <ProgressBar class="text-green-500" /> -->
  <slot/>
</div>

<!-- desktop only -->
<div class="hidden sm:block">
  <Footer footerType="logo">
    <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
    <FooterCopyright by="Busser" />
  </Footer>
</div>

<!-- mobile only -->
{#if data.user}
  <div class="sm:hidden mt-20">
    <MobileNav/>
  </div>
{/if}


