import { mapAuthorsToArtistsQuery } from '$lib/artist-mapping';
import { addMonths } from '$lib/dates';
import { pcoFetch, cacheGet, cacheSet } from '$lib/pco-api.server';

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
