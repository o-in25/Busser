/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}', 
    './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}', 
    './node_modules/flowbite-svelte-icons/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {},
  },
  plugins: [require('flowbite/plugin'),  require('@tailwindcss/line-clamp')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // flowbite-svelte
        // primary: {
        //   50: '#eef2ff',
        //   100: '#e0e7ff',
        //   200: '#c7d2fe',
        //   300: '#a5b4fc',
        //   400: '#818cf8',
        //   500: '#6366f1',
        //   600: '#4f46e5',
        //   700: '#4338ca',
        //   800: '#3730a3',
        //   900: '#312e81',
        //   950: '#1e1b4b'
        // },
        primary: {"50":"#f5f3ff","100":"#ede9fe","200":"#ddd6fe","300":"#c4b5fd","400":"#a78bfa","500":"#8b5cf6","600":"#7c3aed","700":"#6d28d9","800":"#5b21b6","900":"#4c1d95"},
        secondary: {"50":"#fdf4ff","100":"#fae8ff","200":"#f5d0fe","300":"#f0abfc","400":"#e879f9","500":"#d946ef","600":"#c026d3","700":"#a21caf","800":"#86198f","900":"#701a75"}

      }
    }
  }

}

