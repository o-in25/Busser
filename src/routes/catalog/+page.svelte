<script lang="ts">
  import { Card, Listgroup, ListgroupItem,  Avatar } from 'flowbite-svelte';
  let items: Array<any> = [
    {
      img: { src: '/images/profile-picture-1.webp', alt: 'Neil Sims' },
      name: 'Neil Sims',
      email: 'email@windster.com',
      value: '$320'
    },
    {
      img: { src: '/images/profile-picture-2.webp', alt: 'Bonnie Green' },
      name: 'Bonnie Green',
      email: 'email@windster.com',
      value: '$3467'
    },
    {
      img: { src: '/images/profile-picture-3.webp', alt: 'Michael Gough' },
      name: 'Michael Gough',
      email: 'email@windster.com',
      value: '$67'
    }
  ];
</script>

<Card padding="xl" size="xl">
  <div class="flex justify-between items-center mb-4">
    <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">Latest Customers</h5>
    <!-- <a href="/" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"> View all </a> -->
  </div>
  <Listgroup active class="border-0 dark:!bg-transparent">
    {#each items as item}
        <ListgroupItem href="/inventory">
      <div class="w-full flex items-center space-x-4 rtl:space-x-reverse">
      <Avatar src={item.img.src} alt={item.img.alt} class="flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
            {item.name}
          </p>
          <p class="text-sm text-gray-500 truncate dark:text-gray-400">
            {item.email}
          </p>
        </div>
        <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
          {item.value}
        </div>
      </div>
    </ListgroupItem>
    {/each}
  </Listgroup>
</Card>