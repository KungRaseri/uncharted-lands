import adapter from '@sveltejs/adapter-static';
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
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
			fallback: 'index.html'
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
