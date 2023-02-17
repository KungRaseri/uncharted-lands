/// <reference types="vitest" />
import { defineConfig } from 'vite'

import { sentryVitePlugin } from '@sentry/vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from "dotenv";

dotenv.config();

/** @type {import('vite').UserConfig} */
const config = defineConfig({
	build: {
		sourcemap: true
	},
	plugins: [sveltekit({ hot: !process.env.VITEST }),
	sentryVitePlugin({
		org: "red-syndicate",
		project: "browser-game",
		include: './build',
		authToken: process.env.SENTRY_AUTH_TOKEN
	})],
	server: {
		port: 3000
	}
})

export default config;