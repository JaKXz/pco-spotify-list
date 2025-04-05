import { PCO_CLIENT_ID, PCO_CLIENT_SECRET } from "$env/static/private";

import PcoApi from "$lib/planning-center-api.server";

const pcoApi = new PcoApi(PCO_CLIENT_ID, PCO_CLIENT_SECRET);

export async function load({ params }) {
  const { songs } = await pcoApi.getAllSongs();

  return {
    songs,
  };
}
