import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	ssr: {
		noExternal: ['svelte-sonner'],
		external: ['form-data', 'mailgun.js'],
	},
	build: {
		sourcemap: true,
	},
	server: {
		sourcemapIgnoreList: false,
	},
});
