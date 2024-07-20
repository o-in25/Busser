<script>
  import { GradientButton } from "flowbite-svelte";
  import {
    AdjustmentsVerticalOutline,
    ClipboardListOutline,
    HomeSolid,
    WalletSolid,
  } from "flowbite-svelte-icons";
</script>

<div
  class="fixed w-full
  bg-gray-800
  dark:bg-gray-800
  border-none bottom-0 start-0 h-16 border-t">
  <div class="grid h-full max-w-lg mx-auto grid-cols-3 bot-nav">
    <a
      aria-label="Inventory"
      href="/inventory"
      role="link"
      class="group inline-flex flex-col items-center justify-center px-5
      bg-white
      dark:bg-gray-800
      hover:bg-gray-50
      dark:hover:bg-gray-800">
      <ClipboardListOutline
        class="shrink-0 w-5 h-5 mb-1 
          text-gray-900 
          dark:text-white
        group-hover:text-gray-600 
        dark:group-hover:text-gray-500" />
      <span
        class="text-sm
            font-bold
          group-hover:text-primary-600
          dark:group-hover:text-primary-500
        
          text-gray-900
          dark:text-white
          
          hover:text-primary-900
          dark:hover:text-primary-900">
        Inventory
      </span>
    </a>
    <a
      aria-label="Home"
      href="/"
      role="link"
      class="group inline-flex flex-col items-center justify-center px-5
      bg-white
      dark:bg-gray-800
      hover:bg-gray-50
      dark:hover:bg-gray-800 active">
      <HomeSolid
        class="shrink-0 w-5 h-5 mb-1 
          text-gray-900 
          dark:text-white
        group-hover:text-gray-600 
        dark:group-hover:text-gray-500" />
      <span
        class="text-sm
            font-bold
          group-hover:text-primary-600
          dark:group-hover:text-primary-500
        
          text-gray-900
          dark:text-white
          
          hover:text-primary-900
          dark:hover:text-primary-900
          ">
        Home
      </span>
    </a>
    <a
      aria-label="Settings"
      href="/settings"
      role="link"
      class="group inline-flex flex-col items-center justify-center px-5
      bg-white
      dark:bg-gray-800
      hover:bg-gray-50
      dark:hover:bg-gray-800">
      <AdjustmentsVerticalOutline
        class="shrink-0 w-5 h-5 mb-1 
          text-gray-900 
          dark:text-white
        group-hover:text-gray-600 
        dark:group-hover:text-gray-500" />
      <span
        class="text-sm
            font-bold
          group-hover:text-primary-600
          dark:group-hover:text-primary-500
        
          text-gray-900
          dark:text-white
          
          hover:text-primary-900
          dark:hover:text-primary-900">
        Settings
      </span>
    </a>
    
  </div>
</div>

<style lang="scss">

</style>