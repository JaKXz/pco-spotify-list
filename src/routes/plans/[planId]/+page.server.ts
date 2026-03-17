import { mapAuthorsToSpotifyQuery } from '$lib/artist-mapping';
import { pcoFetch } from '$lib/pco/fetch';
import type { SongSubset, Songs } from '$lib/pco/songs';
import { error } from '@sveltejs/kit';
import type { ResourceObject } from 'ts-json-api';
import type { PageServerLoad } from './$types';

interface ServiceType extends ResourceObject {
	attributes: {
		name: string;
	};
}

interface Plan extends ResourceObject {
	attributes: {
		title: string;
		dates: string;
		sort_date: string;
		short_dates: string;
		series_title: string;
	};
}

interface PlanItem extends ResourceObject {
	attributes: {
		title: string;
		item_type: string;
		service_position: string;
		sequence: number;
	};
	relationships?: {
		song?: {
			data?: { type: string; id: string } | null;
		};
	};
}

export const load: PageServerLoad = async ({ params }) => {
	const { planId } = params;

	// Fetch all service types so we can locate which one owns this plan
	const serviceTypesResponse = await pcoFetch<ServiceType[]>('service_types', { per_page: 100 });
	const serviceTypes = serviceTypesResponse.data ?? [];

	if (!serviceTypes.length) {
		error(404, 'No service types found in PCO');
	}

	// Try each service type until we find the plan
	let plan: Plan | null = null;
	let serviceTypeId: string | null = null;
	let serviceTypeName: string = '';

	for (const st of serviceTypes) {
		try {
			const planResponse = await pcoFetch<Plan>(`service_types/${st.id}/plans/${planId}`);
			if (planResponse.data) {
				plan = planResponse.data;
				serviceTypeId = st.id;
				serviceTypeName = st.attributes.name;
				break;
			}
		} catch {
			// Plan not found in this service type, try the next one
			continue;
		}
	}

	if (!plan || !serviceTypeId) {
		error(404, `Plan ${planId} not found in any service type`);
	}

	const { included } = await pcoFetch<PlanItem[]>(
		`service_types/${serviceTypeId}/plans/${planId}/items`,
		{
			include: 'song',
			per_page: 100
		}
	);

	const songs: Songs = included.map((item: SongSubset) => ({
		...item,
		...item.attributes,
		spotifyQuery: mapAuthorsToSpotifyQuery({
			title: item.attributes.title,
			author: item.attributes.author
		}),
		schedules: {
			meta: { total_count: 1 },
			data: [
				{
					id: planId,
					type: 'SongSchedule',
					attributes: {
						plan_sort_date: plan.attributes.sort_date,
						service_type_name: serviceTypeName,
						plan_dates: plan.attributes.dates
					}
				}
			]
		}
	}));

	const [prevPlan, nextPlan] = await Promise.all([
		pcoFetch<Plan>(
			plan.links.previous_plan
				.toString()
				.replace('https://api.planningcenteronline.com/services/v2/', '')
		).catch(() => null),
		pcoFetch<Plan>(
			plan.links.next_plan
				.toString()
				.replace('https://api.planningcenteronline.com/services/v2/', '')
		).catch(() => null)
	]);

	return {
		songs,
		plan: {
			...plan,
			title: plan.attributes.title ?? plan.attributes.dates,
			dates: plan.attributes.dates,
			serviceTypeName
		},
		prevPlan: prevPlan
			? {
					id: prevPlan.data.id,
					title: prevPlan.data.attributes.title ?? prevPlan.data.attributes.dates
				}
			: null,
		nextPlan: nextPlan
			? {
					id: nextPlan.data.id,
					title: nextPlan.data.attributes.title ?? nextPlan.data.attributes.dates
				}
			: null
	};
};
