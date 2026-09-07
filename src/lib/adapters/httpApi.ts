/**
 * Host-aware HTTP adapter — one origin for Netlify, Vite, and Tauri.
 * Web hosts use the page origin (same-origin /api). Packaged desktop must set VITE_API_BASE.
 */
export const API_PATHS = {
	interest: '/api/interest',
	videoToken: '/api/video/token'
} as const;

const TAURI_ORIGIN = /^(tauri:|https?:\/\/(tauri|asset)\.localhost)/i;

export type ApiHostContext = {
	/** Per-call override (tests, video form). */
	override?: string;
	/** Build-time origin, normally import.meta.env.VITE_API_BASE. */
	envBase?: string;
	/** window.location.origin when running in a browser. */
	pageOrigin?: string;
};

export class RemoteApiUnavailableError extends Error {
	constructor(
		message = 'Remote API is not configured for this host. Set VITE_API_BASE to your Netlify site URL.'
	) {
		super(message);
		this.name = 'RemoteApiUnavailableError';
	}
}

export function stripTrailingSlash(url: string): string {
	return url.replace(/\/+$/, '');
}

export function originLooksLikeWebHost(origin: string): boolean {
	if (!origin) return false;
	if (TAURI_ORIGIN.test(origin)) return false;
	return /^https?:\/\//i.test(origin);
}

function readViteApiBase(): string {
	try {
		const value = import.meta.env?.VITE_API_BASE;
		return typeof value === 'string' ? value.trim() : '';
	} catch {
		return '';
	}
}

function currentPageOrigin(): string {
	if (typeof window === 'undefined' || !window.location?.origin) return '';
	return window.location.origin;
}

export function resolveApiBase(ctx: ApiHostContext = {}): string {
	const override = stripTrailingSlash((ctx.override ?? '').trim());
	if (override) return override;
	const envBase = stripTrailingSlash((ctx.envBase ?? readViteApiBase()).trim());
	if (envBase) return envBase;
	const origin = stripTrailingSlash((ctx.pageOrigin ?? currentPageOrigin()).trim());
	if (originLooksLikeWebHost(origin)) return origin;
	return '';
}

export function joinApiUrl(path: string, ctx: ApiHostContext = {}): string {
	const base = resolveApiBase(ctx);
	if (!base) return '';
	const suffix = path.startsWith('/') ? path : `/${path}`;
	return `${base}${suffix}`;
}

export async function postJson(
	path: string,
	body: unknown,
	ctx: ApiHostContext = {}
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
	const url = joinApiUrl(path, ctx);
	if (!url) throw new RemoteApiUnavailableError();
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	const parsed: unknown = await res.json().catch(() => ({}));
	const data =
		parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: {};
	return { ok: res.ok, status: res.status, data };
}
