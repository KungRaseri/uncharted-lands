import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import { mdsvex } from 'mdsvex'
import mdsvexConfig from './mdsvex.config.js'
import { withSentryConfig } from '@sentry/svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		enableSourcemap: true,
	},
	extensions: ['.svelte', '.svx', '.md'],
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess({
		postcss: true,
		sourceMap: true
	}),
	mdsvex(mdsvexConfig)],

	kit: {
		adapter: adapter({})
	}
};

export default withSentryConfig(config);
