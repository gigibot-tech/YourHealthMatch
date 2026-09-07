import { describe, expect, it } from 'vitest';
import {
	joinApiUrl,
	originLooksLikeWebHost,
	resolveApiBase,
	stripTrailingSlash
} from './httpApi';

describe('httpApi host resolution', () => {
	it('strips trailing slashes', () => {
		expect(stripTrailingSlash('https://app.example.com/')).toBe('https://app.example.com');
	});

	it('treats Vite/Netlify origins as web hosts and Tauri asset origins as not', () => {
		expect(originLooksLikeWebHost('http://localhost:5173')).toBe(true);
		expect(originLooksLikeWebHost('https://yourhealthmatch.netlify.app')).toBe(true);
		expect(originLooksLikeWebHost('https://tauri.localhost')).toBe(false);
		expect(originLooksLikeWebHost('http://tauri.localhost')).toBe(false);
		expect(originLooksLikeWebHost('tauri://localhost')).toBe(false);
		expect(originLooksLikeWebHost('https://asset.localhost')).toBe(false);
		expect(originLooksLikeWebHost('')).toBe(false);
	});

	it('prefers override, then env, then a web page origin', () => {
		expect(
			resolveApiBase({
				override: 'https://override.example/',
				envBase: 'https://env.example',
				pageOrigin: 'http://localhost:5173'
			})
		).toBe('https://override.example');
		expect(
			resolveApiBase({
				envBase: 'https://env.example/',
				pageOrigin: 'http://localhost:5173'
			})
		).toBe('https://env.example');
		expect(resolveApiBase({ pageOrigin: 'http://localhost:5173/' })).toBe(
			'http://localhost:5173'
		);
	});

	it('returns empty on packaged Tauri when VITE_API_BASE is unset', () => {
		expect(resolveApiBase({ pageOrigin: 'https://tauri.localhost' })).toBe('');
		expect(joinApiUrl('/api/interest', { pageOrigin: 'https://tauri.localhost' })).toBe('');
	});

	it('joins API paths onto the resolved host', () => {
		expect(
			joinApiUrl('/api/video/token', { envBase: 'https://app.example.com' })
		).toBe('https://app.example.com/api/video/token');
	});
});
