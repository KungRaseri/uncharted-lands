import adapter from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';
import { withSentryConfig } from '@sentry/svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		enableSourcemap: true
	},
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess({
		postcss: true,
		sourceMap: true
	})],

	kit: {
		adapter: adapter({

		}),
		alias: {
		},
		prerender: {
			// This can be false if you're using a fallback (i.e. SPA mode)
			// default: true
		}
	}
};

export default withSentryConfig(config);
