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
    NavLi,
    Dropdown,
    DropdownItem
} from 'flowbite-svelte';
import {
    UserSettingsSolid,
    QuestionCircleSolid,
    UsersGroupOutline,
    UserCircleSolid,
    ArrowRightToBracketOutline
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
            <NavLi href="/contact" class="inline-flex"><QuestionCircleSolid></QuestionCircleSolid></NavLi>
            <NavLi type="button" class="inline-flex" id="setting-link">
                <UserSettingsSolid></UserSettingsSolid>
                <Dropdown triggeredBy="#setting-link">
                    <DropdownItem class="inline-flex" href="/settings/user-management">
                        <UsersGroupOutline></UsersGroupOutline>&nbsp;User Management
                    </DropdownItem>
                    <DropdownItem class="inline-flex" href="/login">
                        <ArrowRightToBracketOutline></ArrowRightToBracketOutline>&nbsp;Sign out
                    </DropdownItem>
                </Dropdown>
            </NavLi>

        </NavUl>
    </Navbar>
    <slot/>
        </div>
