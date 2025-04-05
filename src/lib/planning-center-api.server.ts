import queryString from "query-string";
import ky from "ky";
import type { Response } from "ts-json-api";

export default class PlanningCenterApi {
  private readonly apiUrl: string;
  private readonly fetchOptions: RequestInit;
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
        Authorization: `Basic ${
          btoa(
            `${clientId}:${clientSecret}`,
          )
        }`,
        "Content-Type": "application/json",
        ...headers,
      }),
    };
  }

  public async getAllSongs({
    order = "-last_scheduled_at",
    per_page = 100,
    ...params
  } = {}) {
    return await this.makeRequest({
      queryParams: {
        order,
        per_page,
        "where[hidden]": false,
        ...params,
      },
    });
  }

  private async makeRequest(
    { endpoint = "songs", queryParams, fetchOptions }: {
      endpoint?: string;
      queryParams?: Record<string, any>;
      fetchOptions?: RequestInit;
    } = {},
  ): Promise<Response> {
    const res = await ky(
      `${this.apiUrl}/${endpoint}?${queryString.stringify(queryParams ?? {})}`,
      {
        ...this.fetchOptions,
        ...fetchOptions,
      },
    );
    return await res.json();
  }
}
