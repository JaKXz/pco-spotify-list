import { mapAuthorsToArtistsQuery } from '$lib/artist-mapping';
import { pcoFetch } from '$lib/pco-api.server';
import { error } from '@sveltejs/kit';

// ---------------------------------------------------------------------------
// Page server load – fetch songs from a specific PCO plan
// ---------------------------------------------------------------------------

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const { serviceTypeId, planId } = params;

	let plan;
	try {
		plan = await pcoFetch(`service_types/${serviceTypeId}/plans/${planId}`);
	} catch {
		error(404, 'Plan not found. Check the service type and plan IDs.');
	}

	const planAttrs = plan.data.attributes;

	const itemsResponse = await pcoFetch(`service_types/${serviceTypeId}/plans/${planId}/items`, {
		include: 'song',
		per_page: '100'
	});

	const songItems = (itemsResponse.data ?? []).filter(
		(/** @type {{ attributes: { item_type: string } }} */ item) =>
			item.attributes.item_type === 'song'
	);

	const includedSongs = itemsResponse.included ?? [];

	const songs = songItems.map(
		(
			/** @type {{ attributes: { title: string, sequence: number }, relationships: { song: { data: { id: string } } } }} */ item
		) => {
			const songRel = item.relationships?.song?.data;
			const songData = songRel
				? includedSongs.find((/** @type {{ id: string }} */ s) => s.id === songRel.id)
				: null;

			const title = songData?.attributes?.title ?? item.attributes.title;
			const author = songData?.attributes?.author ?? null;

			return {
				id: songRel?.id ?? item.id,
				title,
				author,
				sequence: item.attributes.sequence,
				spotifyQuery: mapAuthorsToArtistsQuery({ title, author })
			};
		}
	);

	return {
		plan: {
			id: plan.data.id,
			title: planAttrs.title ?? planAttrs.dates,
			dates: planAttrs.dates,
			serviceTypeName: planAttrs.service_type_name
		},
		songs
	};
}
