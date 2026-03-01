import type {
	ResourceObject,
	ResourceObjectOrObjects,
	Response,
	ResponseWithData
} from 'ts-json-api';

import { env } from '$env/dynamic/private';

const PCO_API_URL = 'https://api.planningcenteronline.com/services/v2';

interface Song extends ResourceObject {
	attributes: {
		title: string;
		author: string;
		copyright?: string;
		last_scheduled_at: string;
	};
}

interface SongSchedule extends ResourceObject {
	attributes: {
		plan_sort_date: string;
		service_type_name: string;
	};
}

// ---------------------------------------------------------------------------
// In-memory TTL cache
// Replaces the old sessionStorage caching from the client-side ky
// implementation. Entries survive across requests for the lifetime of the
// server process (dev) or serverless function warm instance (Netlify).
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache: Map<string, { data: Response<ResourceObjectOrObjects>; expiresAt: number }> =
	new Map();

function cacheGet(key: string) {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return undefined;
	}
	return entry.data;
}

function cacheSet(key: string, data: Response<ResourceObjectOrObjects>, ttl = CACHE_TTL_MS) {
	cache.set(key, { data, expiresAt: Date.now() + ttl });
}

// ---------------------------------------------------------------------------
// PCO fetch with cache-aware wrapper
// ---------------------------------------------------------------------------
export async function pcoFetch(
	endpoint: string,
	queryParams: Record<string, string> = {}
): Promise<Response<ResourceObjectOrObjects>> {
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

// ---------------------------------------------------------------------------
// Song schedule fetcher (individually cached, mirrors old sessionStorage key)
// ---------------------------------------------------------------------------
async function getSongSchedules(songId: number) {
	const url = `songs/${songId}/song_schedules`;
	const cached = cacheGet(url);
	if (cached) return cached;

	try {
		const schedules = await pcoFetch(url, {
			filter: 'before',
			before: new Date().toISOString(),
			per_page: '5',
			order: '-plan_sort_date'
		});

		// Cache the schedule result under its own dedicated key so it persists
		// even if the full URL-based cache entry from pcoFetch is evicted.
		cacheSet(url, schedules);
		return schedules;
	} catch {
		return { meta: { total_count: 0 }, data: [] };
	}
}
