import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from "dotenv";

dotenv.config();

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	server: {
		port: 3000
	},
};

export default config;
