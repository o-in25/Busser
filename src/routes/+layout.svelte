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
  import { page } from "$app/stores";
  import MobileNav from "$lib/components/MobileNav.svelte";
  import { ProgressBar } from "@prgm/sveltekit-progress-bar";
  import {
    ArrowRightOutline,
    ArrowRightToBracketOutline,
    CartSolid,
    ChartPieSolid,
    CheckCircleSolid,
    CloseCircleSolid,
    EditOutline,
    GridSolid,
    InfoCircleSolid,
    MailBoxSolid,
    ShoppingBagSolid,
    UsersSolid,
  } from "flowbite-svelte-icons";
  import Notification from "$lib/components/Notification.svelte";
  import { sineIn } from "svelte/easing";
  let hidden1 = true;
  let transitionParams = {
    x: -320,
    duration: 200,
    easing: sineIn,
  };
  $: activeUrl = $page.url.pathname;
  // $: notification = $page.url.searchParams.has('notification');
  // $: notification, check()

  // function check() {
  //   console.log(notification)
  // }
  export let data: LayoutData;
  let spanClass = "flex-1 ms-3 whitespace-nowrap";

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
<div class="">
  <!-- nav -->
  <Navbar color="default" class="mb-3">
    <NavHamburger
      class1="w-full md:flex md:w-auto md:order-1"
      onClick={() => {
        hidden1 = false;
        console.log(";aqd");
      }} />

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
        <DropdownItem href="/tools">Tools</DropdownItem>
        <DropdownDivider />
        <DropdownItem on:click={logout}>
          {#if data.user}Log out{:else}Log In{/if}
        </DropdownItem>
      </Dropdown>
    {/if}

    <!-- tabs -->
    {#if data.user}
      <NavUl
        {activeUrl}
        slideParams={{ delay: 250, duration: 500, easing: sineIn }}
        on:click={() => console.log()}>
        <NavLi href="/" active>Home</NavLi>
        <NavLi href="/inventory">Inventory</NavLi>
        <NavLi href="/catalog">Catalog</NavLi>
        <!-- <NavLi href="/tools">Tools</NavLi> -->
      </NavUl>
    {/if}
  </Navbar>
</div>

<Drawer
  transitionType="fly"
  {transitionParams}
  bind:hidden={hidden1}
  id="sidebar2">
  <div class="flex items-center">
    <h5
      id="drawer-navigation-label-3"
      class="text-base font-semibold text-gray-500 uppercase dark:text-gray-400">
      Menu
    </h5>
    <CloseButton
      on:click={() => (hidden1 = true)}
      class="mb-4 dark:text-white" />
  </div>
  <Sidebar>
    <SidebarWrapper
      divClass="overflow-y-auto py-4 px-3 rounded dark:bg-gray-800">
      <SidebarGroup>
        <SidebarItem label="Dashboard">
          <svelte:fragment slot="icon">
            <ChartPieSolid
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarDropdownWrapper label="E-commerce">
          <svelte:fragment slot="icon">
            <CartSolid
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
          <SidebarDropdownItem label="Products" />
          <SidebarDropdownItem label="Billing" />
          <SidebarDropdownItem label="Invoice" />
        </SidebarDropdownWrapper>
        <SidebarItem label="Kanban" {spanClass}>
          <svelte:fragment slot="icon">
            <GridSolid
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
          <svelte:fragment slot="subtext">
            <span
              class="inline-flex justify-center items-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-300">
              Pro
            </span>
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Inbox" {spanClass}>
          <svelte:fragment slot="icon">
            <MailBoxSolid
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
          <svelte:fragment slot="subtext">
            <span
              class="inline-flex justify-center items-center p-3 ms-3 w-3 h-3 text-sm font-medium text-primary-600 bg-primary-200 rounded-full dark:bg-primary-900 dark:text-primary-200">
              3
            </span>
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Users">
          <svelte:fragment slot="icon">
            <UsersSolid
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Products">
          <svelte:fragment slot="icon">
            <ShoppingBagSolid
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Sign In">
          <svelte:fragment slot="icon">
            <ArrowRightToBracketOutline
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        <SidebarItem label="Sign Up">
          <svelte:fragment slot="icon">
            <EditOutline
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
      </SidebarGroup>
    </SidebarWrapper>
  </Sidebar>
</Drawer>

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
    <FooterCopyright by="Busser" />
  </Footer>
</div>

<!-- mobile only -->
{#if data.user}
  <div class="sm:hidden mt-20">
    <MobileNav {activeUrl} />
  </div>
{/if}
