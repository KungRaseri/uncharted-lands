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
		sourceMap: true,
		typescript: {
			tsconfigFile: false,
			compilerOptions: {
				target: 'esnext',
				module: 'esnext',
				moduleResolution: 'bundler'
			}
		}
	})],

	kit: {
		adapter: adapter({
			runtime: 'nodejs18.x'
		})
	}
};

export default withSentryConfig(config);
