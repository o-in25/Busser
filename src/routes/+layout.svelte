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
    Button,
    CloseButton,
    Drawer,
    Sidebar,
    SidebarDropdownItem,
    SidebarDropdownWrapper,
    SidebarGroup,
    SidebarItem,
    SidebarWrapper,
  } from "flowbite-svelte";
  import logo from "$lib/assets/logo-nav.png";
  import Placeholder from "$lib/components/Placeholder.svelte";
  import { goto, invalidateAll } from "$app/navigation";
    import { ChartPieSolid, CartSolid, GridSolid, MailBoxSolid, UsersSolid, ShoppingBagSolid, ArrowRightToBracketOutline, EditOutline } from "flowbite-svelte-icons";
    import { sineIn } from 'svelte/easing';

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

    let hidden2 = true;
  let spanClass = 'flex-1 ms-3 whitespace-nowrap';
  let transitionParams = {
    x: -320,
    duration: 200,
    easing: sineIn
  };
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
  <!-- <NavUl>
      <NavLi href="/" active={true}>Home</NavLi>
      <NavLi href="/about">About</NavLi>
      <NavLi href="/docs/components/navbar">Navbar</NavLi>
      <NavLi href="/pricing">Pricing</NavLi>
      <NavLi href="/contact">Contact</NavLi>
    </NavUl> -->
</Navbar>
<div class="text-center">
  <Button on:click={() => (hidden2 = false)}>Show navigation</Button>
</div>

  <Sidebar>
    <SidebarWrapper divClass="overflow-y-auto py-4 px-3 rounded dark:bg-gray-800">
      <SidebarGroup>
        <SidebarItem label="Dashboard">
          <svelte:fragment slot="icon">
            <ChartPieSolid class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarDropdownWrapper label="E-commerce">
          <svelte:fragment slot="icon">
            <CartSolid class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
          <SidebarDropdownItem label="Products" />
          <SidebarDropdownItem label="Billing" />
          <SidebarDropdownItem label="Invoice" />
        </SidebarDropdownWrapper>
        <SidebarItem label="Kanban" {spanClass}>
          <svelte:fragment slot="icon">
            <GridSolid class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
          <svelte:fragment slot="subtext">
            <span class="inline-flex justify-center items-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-300"> Pro </span>
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Inbox" {spanClass}>
          <svelte:fragment slot="icon">
            <MailBoxSolid class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
          <svelte:fragment slot="subtext">
            <span class="inline-flex justify-center items-center p-3 ms-3 w-3 h-3 text-sm font-medium text-primary-600 bg-primary-200 rounded-full dark:bg-primary-900 dark:text-primary-200"> 3 </span>
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Users">
          <svelte:fragment slot="icon">
            <UsersSolid class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Products">
          <svelte:fragment slot="icon">
            <ShoppingBagSolid class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Sign In">
          <svelte:fragment slot="icon">
            <ArrowRightToBracketOutline class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Sign Up">
          <svelte:fragment slot="icon">
            <EditOutline class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
      </SidebarGroup>
    </SidebarWrapper>
  </Sidebar>
<div class="container mx-auto px-4">
  <slot />
</div>

<style lang="postcss"></style>
