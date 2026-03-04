import type { PageServerLoad } from './$types';
import { getSongs } from '$lib/pco/songs';

export const load: PageServerLoad = async () => {
	return await getSongs();
};
