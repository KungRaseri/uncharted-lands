import { sveltekit } from '@sveltejs/kit/vite';
import dotenv from "dotenv";

dotenv.config();

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
};

export default config;
