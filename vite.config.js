/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = defineConfig({
	build: {
		sourcemap: true
	},
	plugins: [
		sveltekit()
	],
	server: {
		port: 3000
	},
	preview: {
		port: 4173
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
})

export default config;