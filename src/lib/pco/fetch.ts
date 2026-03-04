import type { ResourceObjectOrObjects, Response } from 'ts-json-api';

import { env } from '$env/dynamic/private';

const PCO_API_URL = 'https://api.planningcenteronline.com/services/v2';

export async function pcoFetch<T extends ResourceObjectOrObjects>(
	endpoint: string,
	params = {},
	options: RequestInit = {}
): Promise<Response<T>> {
	if (!env.PCO_APP_ID || !env.PCO_APP_SECRET) {
		throw new Error(
			`PCO credentials missing — PCO_APP_ID is ${env.PCO_APP_ID === undefined ? 'undefined' : `"${env.PCO_APP_ID}"`}, ` +
				`PCO_APP_SECRET is ${env.PCO_APP_SECRET === undefined ? 'undefined' : 'set'}. ` +
				'Make sure these are defined in your .env file at the project root.'
		);
	}

	const qs = new URLSearchParams(params).toString();
	const url = `${PCO_API_URL}/${endpoint}${qs ? `?${qs}` : ''}`;
	const cached = cacheGet<T>(url);
	if (cached) return cached;

	const auth = Buffer.from(`${env.PCO_APP_ID}:${env.PCO_APP_SECRET}`).toString('base64');

	const res = await fetch(url, {
		...options,
		headers: {
			...options.headers,
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		throw new Error(
			`PCO API error: ${res.status} ${res.statusText}\n Headers: ${res.headers}\n ${res.url}`
		);
	}

	// trust me bro
	const apiResponse = await res.json();
	cacheSet(url, apiResponse);
	return apiResponse;
}

const CACHE_TTL_MS = 3600 * 1000;
// ---------------------------------------------------------------------------
// In-memory TTL cache
// Replaces the old sessionStorage caching from the client-side ky
// implementation. Entries survive across requests for the lifetime of the
// server process (dev) or serverless function warm instance (Netlify).
// ---------------------------------------------------------------------------
const cache: Map<string, { data: Response; expiresAt: number }> = new Map();

function cacheGet<T extends ResourceObjectOrObjects>(key: string): Response<T> | undefined {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return undefined;
	}
	return entry.data as Response<T>;
}

function cacheSet(key: string, data: Response, ttl = CACHE_TTL_MS) {
	cache.set(key, { data, expiresAt: Date.now() + ttl });
}
