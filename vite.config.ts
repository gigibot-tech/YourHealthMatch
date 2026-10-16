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
		}),
		{
			name: 'match-interest-mail',
			configureServer(server) {
				server.middlewares.use(async (req, res, next) => {
					const path = req.url?.split('?')[0];
					if (path !== '/api/interest') return next();
					const chunks: Buffer[] = [];
					for await (const chunk of req) chunks.push(Buffer.from(chunk));
					const interest = await import('./netlify/functions/interest.js');
					const result = await interest.handler({
						httpMethod: req.method || 'GET',
						body: Buffer.concat(chunks).toString() || '{}',
						queryStringParameters: {}
					});
					res.statusCode = result.statusCode;
					for (const [name, value] of Object.entries(result.headers || {})) {
						res.setHeader(name, String(value));
					}
					res.end(result.body);
				});
			}
		}
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	},
	server: {
		proxy: {
			'/api/video': 'http://localhost:3001',
			'/health': 'http://localhost:3001'
		}
	}
});
