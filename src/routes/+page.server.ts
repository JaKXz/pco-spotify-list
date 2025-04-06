import { PCO_CLIENT_ID, PCO_CLIENT_SECRET } from "$env/static/private";

import PcoApi from "$lib/planning-center-api";

const pcoApi = new PcoApi(PCO_CLIENT_ID, PCO_CLIENT_SECRET);

export async function load(_) {
  const { songs } = await pcoApi.getSongsWithSchedules();

  return {
    songs,
  };
}
