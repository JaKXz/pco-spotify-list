import type { PageServerLoad } from './$types';
import { getSongs } from '$lib/pco/songs';

export const load: PageServerLoad = async () => {
	const { songs } = await getSongs();
	return {
		songs
	};
};
