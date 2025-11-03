import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Svelte 5 uses vitePreprocess by default
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			runtime: 'nodejs22.x'
		})
	}
};

export default config;
