import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import type { Config } from '@sveltejs/kit';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
} satisfies Config;

export default config;
