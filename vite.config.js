/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

/** @type {import('vite').UserConfig} */
const config = defineConfig({
	build: {
		sourcemap: true
	},
	plugins: [
		tailwindcss(),
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