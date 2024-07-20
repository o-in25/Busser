<script>
  import { GradientButton } from "flowbite-svelte";
  import {
    AdjustmentsVerticalOutline,
    ClipboardListOutline,
    HomeSolid,
    WalletSolid,
  } from "flowbite-svelte-icons";


  export let activeUrl;
  
  let styles = {
    a: {
      active: 'bg-white dark:bg-gray-800',
      inactive: 'bg-gray-50 dark:bg-gray-800'
    },
    span: {
      active: 'text-primary-600 dark:text-primary-500',
      inactive: 'text-gray-900 dark:text-white'
    },
    svg: {
      active: 'text-gray-600 dark:text-gray-500',
      inactive: 'text-gray-900 dark:text-white'
    }
  }


        // text-gray-900 
        //   dark:text-white
        // group-hover:text-gray-600 
        // dark:group-hover:text-gray-500

          // group-hover:text-primary-600
          // dark:group-hover:text-primary-500
        
          // text-gray-900
          // dark:text-white
          
          // hover:text-primary-900
          // dark:hover:text-primary-900
</script>



<div
  class="fixed w-full
  bg-gray-800
  dark:bg-gray-800
  border-none bottom-0 start-0 h-16 border-t">
  <div class="grid h-full max-w-lg mx-auto grid-cols-3 bot-nav">
    <!-- <a
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
      dark:hover:bg-gray-800">
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
    </a> -->
        <a
      aria-label="Settings"
      href="/inventory"
      class=" group inline-flex flex-col items-center justify-center px-5 {activeUrl.includes('inventory')? styles.a.active : styles.a.inactive}"
    >
      <ClipboardListOutline class="shrink-0 w-5 h-5 mb-1 {activeUrl.includes('inventory')? styles.svg.active : styles.svg.inactive}" />
      <span class="text-sm font-bold {activeUrl.includes('inventory')? styles.span.active : styles.span.inactive}">Inventory</span>
    </a>

        <a
      aria-label="Home"
      href="/"
      class=" group inline-flex flex-col items-center justify-center px-5 {activeUrl === '/'? styles.a.active : styles.a.inactive}"
    >
      <HomeSolid class="shrink-0 w-5 h-5 mb-1 {activeUrl === '/'? styles.svg.active : styles.svg.inactive}" />
      <span class="text-sm font-bold {activeUrl === '/'? styles.span.active : styles.span.inactive}">Home</span>
    </a>
        <a
      aria-label="Settings"
      href="/settings"
      class=" group inline-flex flex-col items-center justify-center px-5 {activeUrl.includes('settings')? styles.a.active : styles.a.inactive}"
    >
      <AdjustmentsVerticalOutline class="shrink-0 w-5 h-5 mb-1 {activeUrl.includes('settings')? styles.svg.active : styles.svg.inactive}" />
      <span class="text-sm font-bold {activeUrl.includes('settings')? styles.span.active : styles.span.inactive}">Settings</span>
    </a>
    
  </div>
</div>

<style lang="scss">

</style>