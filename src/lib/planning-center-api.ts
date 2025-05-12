import queryString, { type StringifiableRecord } from "query-string";
import ky, { type Options } from "ky";
import type {
  ResourceObject,
  ResourceObjectOrObjects,
  Response,
  ResponseWithData,
} from "ts-json-api";

import { addMonths } from "$lib";

interface Song extends ResourceObject {
  attributes: {
    title: string;
    author: string;
    copyright?: string;
    last_scheduled_at: string;
  };
}

interface SongSchedule extends ResourceObject {
  attributes: {
    plan_sort_date: string;
    service_type_name: string;
  };
}

export type SongWithSchedules = Song["attributes"] & {
  schedules: Response<SongSchedule[]>;
};

export default class PlanningCenterApi {
  private readonly apiUrl: string;
  private readonly fetchOptions: Options;
  constructor(
    clientId: string,
    clientSecret: string,
    headers: HeadersInit = {},
  ) {
    if (!clientId || !clientSecret) {
      throw new Error("Client ID and Client Secret are required");
    }

    this.apiUrl = `https://api.planningcenteronline.com/services/v2`;
    this.fetchOptions = {
      headers: new Headers({
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/json",
        ...headers,
      }),
    };
  }

  public async getSongsWithSchedules({
    order = "-last_scheduled_at",
    per_page = 100,
    ...params
  } = {}) {
    const { data, ...rest } = await this.makeRequest<Song[]>({
      queryParams: {
        order,
        per_page,
        "where[hidden]": false,
        ...params,
      },
    });

    if (!data) {
      throw new Error("No data found");
    }

    const songs = data.filter(
      ({ attributes }, index, array) =>
        !/christmas|little drummer boy/i.test(attributes.title) &&
        new Date(attributes.last_scheduled_at) > addMonths(new Date(), -6) &&
        array.findIndex(
            (el) =>
              el.attributes.title.trim().toLowerCase() ===
                attributes.title.trim().toLowerCase(),
          ) === index,
    );

    const songsWithSchedules = await Promise.all(
      songs.map(async ({ attributes, id, ...song }) => {
        const controller = new AbortController();
        let timeoutInFlight;

        const schedules = await Promise.race([
          this.makeRequest<SongSchedule[]>({
            endpoint: `songs/${id}/song_schedules`,
            queryParams: {
              filter: "before",
              before: new Date().toISOString(),
              per_page: 5,
              order: "-plan_sort_date",
            },
            fetchOptions: {
              signal: controller.signal,
              hooks: {
                beforeRequest: [
                  (req) => {
                    const cached = sessionStorage.getItem(
                      `songSchedules.${id}`,
                    );
                    if (cached) {
                      return new Response(cached);
                    }
                    return req;
                  },
                ],
                afterResponse: [
                  async (_, __, response) => {
                    if (response.ok) {
                      sessionStorage.setItem(
                        `songSchedules.${id}`,
                        await response.clone().text(),
                      );
                    }
                    return response;
                  },
                ],
              },
            },
          }),
          new Promise<ResponseWithData<SongSchedule[]>>((resolve) => {
            timeoutInFlight = setTimeout(() => {
              resolve({
                meta: { total_count: 2 },
                data: [],
              });
              controller.abort();
            }, 999);
          }),
        ]);

        clearTimeout(timeoutInFlight);

        return { ...song, ...attributes, schedules, id };
      }),
    );

    return {
      ...rest,
      songs: songsWithSchedules.filter(
        ({ schedules }) =>
          schedules.meta?.total_count > 1 &&
          schedules.data?.every(
            ({ attributes }) =>
              !/christmas/i.test(attributes.service_type_name),
          ),
      ),
    };
  }

  private async makeRequest<D extends ResourceObjectOrObjects>({
    endpoint = "songs",
    queryParams,
    fetchOptions,
  }: {
    endpoint?: string;
    queryParams?: StringifiableRecord;
    fetchOptions?: Options;
  } = {}): Promise<Response<D>> {
    const res = await ky(
      `${this.apiUrl}/${endpoint}?${queryString.stringify(queryParams ?? {})}`,
      {
        ...this.fetchOptions,
        ...fetchOptions,
      },
    );
    return await res.json();
  }

  static mapAuthorsToArtistsQuery(song: any) {
    return "";
  }
}
