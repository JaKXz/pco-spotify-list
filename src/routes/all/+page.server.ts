import { getSongs } from '$lib/pco/songs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { songs } = await getSongs();
	return {
		songs
	};
};
