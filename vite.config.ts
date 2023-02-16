import { sentryVitePlugin } from '@sentry/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import dotenv from "dotenv";

dotenv.config();

const config: UserConfig = {
	build: {
		sourcemap: true
	},
	plugins: [sveltekit(),
	sentryVitePlugin({
		org: "red-syndicate",
		project: "browser-game",
		include: './build',
		authToken: process.env.SENTRY_AUTH_TOKEN
	})],
	server: {
		port: 3000
	},
	test: {
		include: ['src/**/*.{test}.{js,ts}']
	}
};

export default config;
