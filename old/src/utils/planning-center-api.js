import ky from "ky";
import { stringify } from "query-string";
import { addMonths } from "./dates";

export default class PlanningCenterApi {
  constructor({ headers } = {}) {
    this.apiUrl = `https://api.planningcenteronline.com/services/v2`;
    this.fetchOptions = {
      headers: new Headers({
        Authorization: `Basic ${btoa(
          `${process.env.PCO_APP_ID}:${process.env.PCO_APP_SECRET}`
        )}`,
        "Content-Type": "application/json",
        ...headers,
      }),
    };
  }

  makeRequest({ endpoint = "songs", queryParams, fetchOptions }) {
    return ky(`${this.apiUrl}/${endpoint}?${stringify(queryParams)}`, {
      ...this.fetchOptions,
      ...fetchOptions,
    }).then((res) => res.json());
  }

  getAllSongs({
    order = "-last_scheduled_at",
    per_page = 100,
    ...params
  } = {}) {
    return this.makeRequest({
      queryParams: {
        order,
        per_page,
        "where[hidden]": false,
        ...params,
      },
    }).then(async ({ data, ...rest }) => ({
      ...rest,
      data: sortByUsageCount(
        await Promise.all(
          data.filter(schedulesRequestFilters()).map(this.getSongSchedules())
        ).then((response) => response.filter(schedulesCriteria()))
      ),
    }));
  }

  getSongSchedules() {
    return async ({ attributes, id }) => {
      const controller = new AbortController();
      let timeoutInFlight;

      const schedules = await Promise.race([
        this.makeRequest({
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
                  const cached = sessionStorage.getItem(`songSchedules.${id}`);
                  if (cached) {
                    return new Response(cached);
                  }
                  return req;
                },
              ],
              afterResponse: [
                async (_req, _options, response) => {
                  if (response.ok) {
                    sessionStorage.setItem(
                      `songSchedules.${id}`,
                      await response.clone().text()
                    );
                  }
                  return response;
                },
              ],
            },
          },
        }),
        new Promise((resolve) => {
          timeoutInFlight = setTimeout(() => {
            resolve({ meta: { total_count: 2 }, data: [] });
            controller.abort();
          }, 999);
        }),
      ]);

      clearTimeout(timeoutInFlight);
      return { ...attributes, schedules, id };
    };
  }

  static mapAuthorsToArtistsQuery({ title, author }) {
    if (author == null) {
      return title;
    }
    let artist = "";
    const hillsong = checkAuthors([
      "Brooke Fraser",
      "Ligertwood",
      "Reuben Morgan",
      "Aodhan King",
      "Houston",
      "Marty Sampson",
      "Benjamin Hastings",
    ]);
    const bethel = checkAuthors([
      "McClure",
      "Helser",
      "Jenn Johnson",
      "Brian Johnson",
    ]);
    if (hillsong({ author })) {
      artist = "Live Hillsong";
    } else if (author.includes("Steven Furtick")) {
      artist = "Elevation";
    } else if (author.includes("Kari Jobe")) {
      artist = "Kari Jobe";
    } else if (author.includes("Aaron Moses")) {
      artist = "Maverick City Music";
    } else if (author.includes("Nate Moore")) {
      artist = "Housefires";
    } else if (author.includes("Mia Fieldes")) {
      artist = "Vertical";
    } else if (author.includes("Leslie Jordan")) {
      artist = "All Sons";
    } else if (author.includes("Cory Asbury")) {
      artist = "Cory Asbury";
    } else if (bethel({ author })) {
      artist = "Live Bethel";
    } else {
      artist = author.split(",")[0].split("and")[0];
    }
    return `${title} ${artist.trim()}`;
  }
}

function sortByUsageCount(songs) {
  return [...songs].sort(
    (a, b) => a.schedules.meta.total_count - b.schedules.meta.total_count
  );
}

function schedulesRequestFilters({ minusMonths = -6 } = {}) {
  return ({ attributes }, index, array) =>
    !/christmas|little drummer boy/i.test(attributes.title) &&
    new Date(attributes.last_scheduled_at) >
      addMonths(new Date(), minusMonths) &&
    array.findIndex(
      (el) =>
        el.attributes.title.trim().toLowerCase() ===
        attributes.title.trim().toLowerCase()
    ) === index;
}

function schedulesCriteria() {
  return ({ schedules }) =>
    schedules.meta?.total_count > 1 &&
    schedules.data.every(
      ({ attributes }) => !/christmas/i.test(attributes.service_type_name)
    );
}

function checkAuthors(authors) {
  const check = new RegExp(authors.join("|"));
  return ({ author }) => check.test(author);
}
