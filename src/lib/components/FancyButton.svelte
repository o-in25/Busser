<script lang="ts">
  export let href: string = '/';
</script>

<div
  class="p-0.5 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-blue-300 dark:focus:ring-blue-800 rounded-lg">
  <a
    href="{href}"
    class="text-center font-medium focus-within:ring-4 focus-within:outline-none px-4 py-2 text-base inline-flex items-center justify-center w-full !border-0 !rounded-md bg-white !text-gray-800 dark:bg-gray-800 dark:!text-white hover:bg-transparent hover:!text-inherit transition-all duration-75 ease-in group-hover:!bg-opacity-0 group-hover:!text-inherit"
    role="button">
    <slot/>
    <!-- <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      color="currentColor"
      class="shrink-0 w-5 h-5 mr-1"
      role="img"
      aria-label="edit outline"
      viewBox="0 0 24 24">
      <path
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z">
      </path>
    </svg> -->
  </a>
</div>
