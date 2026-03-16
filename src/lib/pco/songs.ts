import { mapAuthorsToSpotifyQuery } from '$lib/artist-mapping';
import { batchAsync } from '$lib/batch-async';
import { MAX_FUTURE_WINDOW, MAX_PAST_WINDOW } from '$lib/dates';
import { pcoFetch } from '$lib/pco/fetch';
import type { ResourceObject, ResponseWithData } from 'ts-json-api';

export interface SongSubset extends ResourceObject {
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
	let { data: songs, ...rest } = await pcoFetch<SongSubset[]>('songs', {
		order: '-last_scheduled_at',
		per_page: 100,
		'where[hidden]': false,
		'where[last_scheduled_at][gte]': MAX_PAST_WINDOW.toISOString()
	});
	if (!songs || !songs.length) {
		throw new Error('No data found');
	}

	const seenTitles = new Set();

	let { next } = rest.links;
	while (typeof next === 'string' && songs.length >= 100) {
		const response = await pcoFetch<SongSubset[]>(next.split('/').pop());
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

	const songsWithSchedules = await batchAsync(songs, async ({ attributes, id, ...song }) => {
		const schedules = await pcoFetch<SongSchedule[]>(
			`songs/${id}/song_schedules`,
			{
				filter: 'before',
				before: MAX_FUTURE_WINDOW.toISOString(),
				per_page: 5,
				order: '-plan_sort_date'
			},
			{
				timeout: 5000,
				retry: {
					limit: 3,
					retryOnTimeout: true
				}
			}
		).catch(
			(): ResponseWithData<SongSchedule[]> => ({
				meta: { total_count: 2 },
				data: []
			})
		);

		return {
			...song,
			...attributes,
			schedules,
			id,
			spotifyQuery: mapAuthorsToSpotifyQuery({
				title: attributes.title,
				author: attributes.author
			})
		};
	});

	return {
		...rest,
		songs: songsWithSchedules
			.filter(
				({ schedules }) =>
					schedules.meta?.total_count > 1 &&
					schedules.data?.some(({ attributes }) => attributes.service_type_name.includes('Campus'))
			)
			.toSorted((a, b) => a.schedules.meta.total_count - b.schedules.meta.total_count)
	};
}

function scheduledInWindow(date: string) {
	return new Date(date) > MAX_PAST_WINDOW;
}
