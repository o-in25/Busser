<script lang="ts">
  import "../app.css";
  import type { LayoutData } from "./$types";
  import {
    BottomNav,
    BottomNavItem,
    Navbar,
    NavBrand,
    NavHamburger,
    NavUl,
    NavLi,
    Dropdown,
    DropdownItem,
    DropdownHeader,
    DropdownDivider,
    Avatar,
  } from "flowbite-svelte";
  import {
    UserSettingsSolid,
    QuestionCircleSolid,
    UsersGroupOutline,
    UserCircleSolid,
    ArrowRightToBracketOutline,
  } from "flowbite-svelte-icons";
  import logo from "$lib/assets/logo.png";
  import Placeholder from "$lib/components/Placeholder.svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { user } from "../stores";

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
    <img src={logo} class="me-3 h-6 sm:h-9" alt="Flowbite Logo" />
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
<div class="container mx-auto px-4">
  <slot />
</div>

<style lang="postcss"></style>
