 <script lang="ts">
  import { Toggle } from 'flowbite-svelte';
  import { themeStore } from '../../stores';

  let currentTheme =  '';
  themeStore.subscribe((value) => currentTheme = value);

  const toggleTheme = async ({ target }) => {
    const targetEl = target as HTMLElement;
    const isDark = targetEl.ownerDocument.documentElement.classList.toggle('dark');
    if(targetEl.ownerDocument === document)
      // we are NOT in the iFrame
      currentTheme = isDark? 'dark' : 'light';
      themeStore.set(currentTheme)
      localStorage.setItem('color-theme', currentTheme);
  };
</script>

<svelte:head>
  <script>
    if ('color-theme' in localStorage) {
      // explicit preference - overrides author's choice
      localStorage.getItem('color-theme') === 'dark' ? window.document.documentElement.classList.add('dark') : window.document.documentElement.classList.remove('dark');
    } else {
      // browser preference - does not overrides
      if(window.matchMedia('(prefers-color-scheme: dark)').matches) window.document.documentElement.classList.add('dark');
    }
  </script>
</svelte:head>

<Toggle on:change={(event) => toggleTheme(event)} checked={currentTheme === 'dark'}>Dark Mode</Toggle>
