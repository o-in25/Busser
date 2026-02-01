import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
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
