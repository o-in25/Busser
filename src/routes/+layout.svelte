<script lang="ts">
import "../app.css";
import type {
    LayoutData
} from './$types';
import {
    BottomNav,
    BottomNavItem,
    Navbar,
    NavBrand,
    NavHamburger,
    NavUl,
    NavLi
} from 'flowbite-svelte';
import {
    HomeSolid,
    WalletSolid,
    AdjustmentsVerticalOutline,
    UserCircleSolid
} from 'flowbite-svelte-icons';
import logo from '$lib/assets/logo.png';

export let data: LayoutData;
</script>

<style lang="postcss">

</style>

<div class="container mx-auto px-4">
    <Navbar>
        <NavBrand href="/">
            <img src={logo} class="me-3 h-6 sm:h-9" alt="Logo" />
            <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"></span>
        </NavBrand>
        <NavHamburger  />
        <NavUl >
            <NavLi href="/">Home</NavLi>
            <NavLi href="/about">About</NavLi>
            <NavLi href="/docs/components/navbar">Navbar</NavLi>
            <NavLi href="/pricing">Pricing</NavLi>
            <NavLi href="/contact">Contact</NavLi>
        </NavUl>
    </Navbar>
    <slot/>
</div>
