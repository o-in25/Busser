<script lang="ts">
  import type { User } from "$lib/types";
  import {
    Navbar,
    NavHamburger,
    NavBrand,
    Dropdown,
    DropdownHeader,
    DropdownItem,
    DropdownDivider,
    NavUl,
    NavLi,
    Drawer,
    CloseButton,
    Sidebar,
    SidebarWrapper,
    SidebarGroup,
    SidebarItem,
    SidebarDropdownWrapper,
    SidebarDropdownItem,
  } from "flowbite-svelte";
  import {
    ChartPieSolid,
    CartSolid,
    GridSolid,
    MailBoxSolid,
    UsersSolid,
    ShoppingBagSolid,
    ArrowRightToBracketOutline,
    EditOutline,
    ClipboardListOutline,
    GridOutline,
    HomeOutline,
    CogOutline,
    RulerCombinedOutline,
  } from "flowbite-svelte-icons";
  import { sineIn } from "svelte/easing";
  import { goto, invalidateAll } from "$app/navigation";
  import Placeholder from "./Placeholder.svelte";
  import logo from "$lib/assets/logo-nav.png";

  // props
  export let user: User | null;
  export let activeUrl: string;

  async function logout() {
    const response = await fetch("/logout", {
      method: "POST",
    });
    if (response.ok) {
      await invalidateAll();
      await goto(`/`);
    }
  }

  let showDrawer = true;
  let transitionParams = {
    x: -320,
    duration: 200,
    easing: sineIn,
  };
</script>

<!-- desktop only -->
<!-- nav -->
<Navbar color="default" class="mb-3">
  {#if user}
    <NavHamburger
      class1="w-full md:flex md:w-auto md:order-1"
      onClick={() => {
        showDrawer = false;
      }} />
  {/if}

  <!-- logo -->
  <div class={!user ? "m-auto" : ""}>
    <NavBrand href="/">
      <img src={logo} class="me-3 h-12" alt="Flowbite Logo" />
      <span
        class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
      </span>
    </NavBrand>
  </div>
  {#if user}
    <!-- avatar -->
    <div class="flex items-center md:order-2 user-nav">
      <div class="hidden md:block">
        <Placeholder id="avatar-menu" />
      </div>
    </div>
    <!-- dropdown -->
    <Dropdown placement="right" triggeredBy="#avatar-menu" class="py-4">
      <DropdownHeader>
        <span class="block text-sm">{user?.username}</span>
        <span class="block truncate text-sm font-medium">
          {user.email}
        </span>
      </DropdownHeader>
      <DropdownItem href="/settings">Settings</DropdownItem>
      <DropdownItem href="/tools">Tools</DropdownItem>
      <DropdownDivider />
      <DropdownItem on:click={logout}>
        {#if user}Log out{:else}Log In{/if}
      </DropdownItem>
    </Dropdown>
  {/if}

  <!-- tabs -->
  {#if user}
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

<!-- mobile only -->
<Drawer
  transitionType="fly"
  {transitionParams}
  bind:hidden={showDrawer}
  id="sidebar2">
  <!-- user profile -->
  <div class="flex items-center">
    <div class="flex">
      <div class="self-center">
        <Placeholder id="avatar-menu-mobile" />
      </div>

      <div class="ml-3">
        <h5 class="text-lg font-medium text-gray-900 dark:text-white">
          {user?.username}
        </h5>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {user?.email}
        </span>
      </div>
    </div>

    <!-- close -->
    <CloseButton
      on:click={() => (showDrawer = true)}
      class="mb-4 dark:text-white" />
  </div>

  <Sidebar>
    <SidebarWrapper
      divClass="overflow-y-auto py-4 px-3 rounded dark:bg-gray-800">
      <SidebarGroup>

        <SidebarItem
          label="Home"
          href="/"
          on:click={() => (showDrawer = true)}>
          <svelte:fragment slot="icon">
            <HomeOutline
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>

        <SidebarItem
          label="Inventory"
          href="/inventory"
          on:click={() => (showDrawer = true)}>
          <svelte:fragment slot="icon">
            <ClipboardListOutline
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>

        <SidebarItem
          label="Catalog"
          href="/catalog"
          on:click={() => (showDrawer = true)}>
          <svelte:fragment slot="icon">
            <GridOutline
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>

        <hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />
        
        <SidebarItem
          label="Tools"
          href="/tools"
          on:click={() => (showDrawer = true)}>
          <svelte:fragment slot="icon">
            <RulerCombinedOutline
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        
        <SidebarItem
          label="Settings"
          href="/settings"
          on:click={() => (showDrawer = true)}>
          <svelte:fragment slot="icon">
            <CogOutline
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>

        <hr class="h-px my-8 bg-gray-200 border-0 dark:bg-gray-700" />

        <SidebarItem label="Log Out">
          <svelte:fragment slot="icon">
            <ArrowRightToBracketOutline
              class="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
      </SidebarGroup>
    </SidebarWrapper>
  </Sidebar>
</Drawer>

<style lang="scss">
  .user-nav {
    width: 40px;
  }
</style>
