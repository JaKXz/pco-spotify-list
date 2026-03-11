import type { ResourceObject, ResponseWithData } from 'ts-json-api';
import { mapAuthorsToSpotifyQuery } from '$lib/artist-mapping';
import { addMonths } from '$lib/dates';
import { pcoFetch } from '$lib/pco/fetch';

interface Song extends ResourceObject {
	attributes: {
		title: string;
		author: string;
		copyright?: string;
		last_scheduled_at: string;
		last_scheduled_short_dates: string;
	};
}

interface SongSchedule extends ResourceObject {
	attributes: {
		plan_sort_date: string;
		service_type_name: string;
		plan_dates: string;
	};
}

export type Songs = Awaited<ReturnType<typeof getSongs>>['songs'];

export async function getSongs() {
	let { data: songs, ...rest } = await pcoFetch<Song[]>('songs', {
		order: '-last_scheduled_at',
		per_page: 100,
		'where[hidden]': false
	});
	if (!songs) {
		throw new Error('No data found');
	}

	const seenTitles = new Set();

	let { next } = rest.links;
	while (typeof next === 'string' && songs.length >= 100) {
		const response = await pcoFetch<Song[]>(next.split('/').pop());
		const filtered = response.data.filter(({ attributes }) =>
			scheduledInWindow(attributes.last_scheduled_at)
		);
		songs.push(...filtered);
		if (filtered.length < 100) {
			next = null;
		} else {
			next = response.links.next;
		}
	}

	songs = songs.filter(({ attributes }) => {
		const key = attributes.title.toLowerCase().replaceAll(/[\[\]()\s]+/g, '');

		if (seenTitles.has(key)) {
			return false;
		}

		seenTitles.add(key);
		return scheduledInWindow(attributes.last_scheduled_at);
	});

	const songsWithSchedules = await Promise.all(
		songs.map(async ({ attributes, id, ...song }) => {
			const controller = new AbortController();
			let timeoutInFlight: ReturnType<typeof setTimeout>;

			const fallback: ResponseWithData<SongSchedule[]> = {
				meta: { total_count: 2 },
				data: []
			};
			const schedules = await Promise.race([
				pcoFetch<SongSchedule[]>(
					`songs/${id}/song_schedules`,
					{
						filter: 'before',
						before: addMonths(new Date(), 3).toISOString(),
						per_page: 5,
						order: '-plan_sort_date'
					},
					{
						signal: controller.signal
					}
				).catch(() => fallback),
				new Promise<ResponseWithData<SongSchedule[]>>((resolve) => {
					timeoutInFlight = setTimeout(() => {
						controller.abort();
						resolve(fallback);
					}, 999);
				})
			]);

			clearTimeout(timeoutInFlight);

			const pastDate =
				new Date(attributes.last_scheduled_at) < new Date()
					? attributes.last_scheduled_short_dates
					: schedules.data[0]?.attributes.plan_dates;

			return {
				...song,
				...attributes,
				schedules,
				id,
				lastScheduledShortDates: pastDate,
				spotifyQuery: mapAuthorsToSpotifyQuery({
					title: attributes.title,
					author: attributes.author
				})
			};
		})
	);

	const maxSongCount = Math.max(...songsWithSchedules.map((s) => s.schedules.meta.total_count));

	const sixMonthsAgo = addMonths(new Date(), -6).toDateString();

	return {
		...rest,
		songs: songsWithSchedules
			.filter(
				({ schedules }) =>
					schedules.meta?.total_count > 1 &&
					schedules.data?.every(
						({ attributes }) => !/christmas/i.test(attributes.service_type_name)
					)
			)
			.toSorted((a, b) => a.schedules.meta.total_count - b.schedules.meta.total_count),
		maxSongCount,
		sixMonthsAgo
	};
}

function scheduledInWindow(date: string) {
	return new Date(date) > addMonths(new Date(), -6);
}
