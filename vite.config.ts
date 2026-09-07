import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: false
			}),
			prerender: {
				handleUnseenRoutes: 'ignore',
				handleHttpError: 'warn'
			}
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	},
	server: {
		proxy: {
			'/api': 'http://localhost:3001',
			'/health': 'http://localhost:3001'
		}
	}
});
