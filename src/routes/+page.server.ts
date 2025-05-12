import { PCO_APP_ID, PCO_APP_SECRET } from "$env/static/private";

import PcoApi from "$lib/planning-center-api";

const pcoApi = new PcoApi(PCO_APP_ID, PCO_APP_SECRET);

export async function load(_) {
  const { songs } = await pcoApi.getSongsWithSchedules();

  return {
    songs,
  };
}
