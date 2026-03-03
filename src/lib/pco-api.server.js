import { env } from '$env/dynamic/private';

const PCO_API_URL = 'https://api.planningcenteronline.com/services/v2';

// ---------------------------------------------------------------------------
// In-memory TTL cache
// Replaces the old sessionStorage caching from the client-side ky
// implementation. Entries survive across requests for the lifetime of the
// server process (dev) or serverless function warm instance (Netlify).
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** @type {Map<string, { data: any, expiresAt: number }>} */
const cache = new Map();

/** @param {string} key */
export function cacheGet(key) {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return undefined;
	}
	return entry.data;
}

/**
 * @param {string} key
 * @param {any} data
 * @param {number} [ttl]
 */
export function cacheSet(key, data, ttl = CACHE_TTL_MS) {
	cache.set(key, { data, expiresAt: Date.now() + ttl });
}

// ---------------------------------------------------------------------------
// PCO fetch with cache-aware wrapper
// ---------------------------------------------------------------------------

/**
 * @param {string} endpoint
 * @param {Record<string, string>} [queryParams]
 */
export async function pcoFetch(endpoint, queryParams = {}) {
	if (!env.PCO_APP_ID || !env.PCO_APP_SECRET) {
		throw new Error(
			`PCO credentials missing — PCO_APP_ID is ${env.PCO_APP_ID === undefined ? 'undefined' : `"${env.PCO_APP_ID}"`}, ` +
				`PCO_APP_SECRET is ${env.PCO_APP_SECRET === undefined ? 'undefined' : 'set'}. ` +
				'Make sure these are defined in your .env file at the project root.'
		);
	}
	const auth = Buffer.from(`${env.PCO_APP_ID}:${env.PCO_APP_SECRET}`).toString('base64');
	const qs = new URLSearchParams(queryParams).toString();
	const url = `${PCO_API_URL}/${endpoint}${qs ? `?${qs}` : ''}`;

	const cached = cacheGet(url);
	if (cached) return cached;

	const res = await fetch(url, {
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/json'
		}
	});

	if (!res.ok) {
		throw new Error(
			`PCO API error: ${res.status} ${res.statusText}\n Headers: ${res.headers}\n ${res.url}`
		);
	}

	const data = await res.json();
	cacheSet(url, data);
	return data;
}
