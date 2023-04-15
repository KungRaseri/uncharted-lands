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
		adapter: adapter({}),
		csp: {
			mode: 'auto',
			directives: {
				'img-src': [
					'self',
					'data:',
					'https://via.placeholder.com'
				],
				'style-src': [
					'self',
					'https://fonts.googleapis.com'
				],
				'script-src': [
					'self',
				],
				'default-src': [
					'self',
					'https://fonts.gstatic.com',
					'https://vitals.vercel-insights.com',
					'https://o4504635308638208.ingest.sentry.io'
				]
			}
		}
	}
};

export default withSentryConfig(config);
