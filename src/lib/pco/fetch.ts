import ky, { type Options } from 'ky';
import type { Response as JasonApiResponse, ResourceObjectOrObjects } from 'ts-json-api';

import { env } from '$env/dynamic/private';

export async function pcoFetch<T extends ResourceObjectOrObjects>(
	endpoint: string,
	searchParams = {},
	options: Options = {}
) {
	return api.get(endpoint, { searchParams, ...options }).json<JasonApiResponse<T>>();
}

const api = ky.create({
	prefixUrl: 'https://api.planningcenteronline.com/services/v2',
	timeout: 30_000,
	retry: {
		limit: 3,
		backoffLimit: 10_000, // cap exponential backoff at 10s
		delay: (
			attemptCount // slightly slower ramp than default
		) => 0.5 * 2 ** (attemptCount - 1) * 1000,
		jitter: true // randomize to avoid thundering herd
	},
	hooks: {
		beforeRequest: [
			(request) => {
				const auth = getPcoAuth();
				request.headers.set('Authorization', `Basic ${auth}`);
				request.headers.set('Content-Type', 'application/json');
			},
			(request) => {
				const cached = cacheGet(request.url);
				if (cached) {
					return new Response(JSON.stringify(cached), {
						status: 200,
						headers: { 'Content-Type': 'application/json', 'X-Svelte-Cache': 'HIT' }
					});
				}
			}
		],
		afterResponse: [
			async (_request, _options, response, _state) => {
				if (response.ok && !response.headers.has('X-Svelte-Cache')) {
					const body = await response.clone().json();
					cacheSet(response.url, body);
				}
				return response;
			}
		]
	}
});

function getPcoAuth() {
	if (!env.PCO_APP_ID || !env.PCO_APP_SECRET) {
		throw new Error(
			`PCO credentials missing — PCO_APP_ID is ${env.PCO_APP_ID === undefined ? 'undefined' : `"${env.PCO_APP_ID}"`}, ` +
				`PCO_APP_SECRET is ${env.PCO_APP_SECRET === undefined ? 'undefined' : 'set'}. ` +
				'Make sure these are defined in your .env file at the project root.'
		);
	}

	return Buffer.from(`${env.PCO_APP_ID}:${env.PCO_APP_SECRET}`).toString('base64');
}

const CACHE_TTL_MS = 3600 * 1000;
// ---------------------------------------------------------------------------
// In-memory TTL cache
// Entries survive across requests for the lifetime of the
// server process (dev) or serverless function warm instance (Netlify).
// ---------------------------------------------------------------------------
const cache: Map<string, { data: JasonApiResponse; expiresAt: number }> = new Map();

function cacheGet(key: string) {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return undefined;
	}
	return entry.data;
}

function cacheSet(key: string, data: JasonApiResponse, ttl = CACHE_TTL_MS) {
	cache.set(key, { data, expiresAt: Date.now() + ttl });
}
