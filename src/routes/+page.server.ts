import { PCO_CLIENT_ID, PCO_CLIENT_SECRET } from "$env/static/private";

import PcoApi from "$lib/planning-center-api.server";
import type { PageServerLoad } from "./$types";

const pcoApi = new PcoApi(PCO_CLIENT_ID, PCO_CLIENT_SECRET);

export const load: PageServerLoad = async ({ params }) => {
  const { data } = await pcoApi.getAllSongs();
  return {
    data,
  };
};
