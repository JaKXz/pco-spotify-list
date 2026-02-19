import { env } from '$env/dynamic/private';
import { mapAuthorsToArtistsQuery } from '$lib/utils/artist-mapping';

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

function cacheGet(key) {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return undefined;
	}
	return entry.data;
}

function cacheSet(key, data, ttl = CACHE_TTL_MS) {
	cache.set(key, { data, expiresAt: Date.now() + ttl });
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function addMonths(input, months) {
	const date = new Date(input);
	date.setDate(1);
	date.setMonth(date.getMonth() + months);
	const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	date.setDate(Math.min(input.getDate(), daysInMonth));
	return date;
}

// ---------------------------------------------------------------------------
// PCO fetch with cache-aware wrapper
// ---------------------------------------------------------------------------
async function pcoFetch(endpoint, queryParams = {}) {
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
		throw new Error(`PCO API error: ${res.status} ${res.statusText}`);
	}

	const data = await res.json();
	cacheSet(url, data);
	return data;
}

// ---------------------------------------------------------------------------
// Filters & sorting
// ---------------------------------------------------------------------------
function schedulesRequestFilter(minusMonths = -6) {
	const cutoff = addMonths(new Date(), minusMonths);
	return (song, index, array) =>
		!/christmas|little drummer boy/i.test(song.attributes.title) &&
		new Date(song.attributes.last_scheduled_at) > cutoff &&
		array.findIndex(
			(el) =>
				el.attributes.title.trim().toLowerCase() === song.attributes.title.trim().toLowerCase()
		) === index;
}

function schedulesCriteria(song) {
	return (
		song.schedules.meta?.total_count > 1 &&
		song.schedules.data.every(({ attributes }) => !/christmas/i.test(attributes.service_type_name))
	);
}

function sortByUsageCount(songs) {
	return [...songs].sort((a, b) => a.schedules.meta.total_count - b.schedules.meta.total_count);
}

// ---------------------------------------------------------------------------
// Song schedule fetcher (individually cached, mirrors old sessionStorage key)
// ---------------------------------------------------------------------------
async function getSongSchedules(songId) {
	const cacheKey = `songSchedules.${songId}`;
	const cached = cacheGet(cacheKey);
	if (cached) return cached;

	try {
		const schedules = await pcoFetch(`songs/${songId}/song_schedules`, {
			filter: 'before',
			before: new Date().toISOString(),
			per_page: '5',
			order: '-plan_sort_date'
		});
		// Cache the schedule result under its own dedicated key so it persists
		// even if the full URL-based cache entry from pcoFetch is evicted.
		cacheSet(cacheKey, schedules);
		return schedules;
	} catch {
		return { meta: { total_count: 0 }, data: [] };
	}
}

// ---------------------------------------------------------------------------
// Page server load
// ---------------------------------------------------------------------------

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const songsResponse = await pcoFetch('songs', {
		order: '-last_scheduled_at',
		per_page: '100',
		'where[hidden]': 'false'
	});

	const filteredSongs = songsResponse.data.filter(schedulesRequestFilter());

	const songsWithSchedules = await Promise.all(
		filteredSongs.map(async (song) => {
			const schedules = await getSongSchedules(song.id);
			const attrs = song.attributes;

			const lastScheduledAt = attrs.last_scheduled_at;
			const pastDate =
				new Date(lastScheduledAt) < new Date()
					? attrs.last_scheduled_short_dates
					: schedules.data[0]?.attributes.plan_dates;

			return {
				id: song.id,
				title: attrs.title,
				author: attrs.author,
				lastScheduledAt,
				lastScheduledShortDates: pastDate,
				schedules: {
					meta: schedules.meta,
					data: schedules.data
				},
				spotifyQuery: mapAuthorsToArtistsQuery({
					title: attrs.title,
					author: attrs.author
				})
			};
		})
	);

	const activeSongs = sortByUsageCount(songsWithSchedules.filter(schedulesCriteria));

	const maxSongCount = activeSongs.length
		? Math.max(...activeSongs.map((s) => s.schedules.meta.total_count))
		: 100;

	const sixMonthsAgo = addMonths(new Date(), -6).toDateString();

	return {
		songs: activeSongs,
		maxSongCount,
		sixMonthsAgo
	};
}
