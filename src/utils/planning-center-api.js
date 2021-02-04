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
    return fetch(`${this.apiUrl}/${endpoint}?${stringify(queryParams)}`, {
      ...this.fetchOptions,
      ...fetchOptions,
    }).then((res) => res.json());
  }

  getAllSongs({ order = "-last_scheduled_at", per_page = 75, ...params } = {}) {
    return this.makeRequest({
      queryParams: {
        order,
        per_page,
        "where[hidden]": false,
        ...params,
      },
    });
  }

  static schedulesRequestFilters() {
    return ({ attributes }, index, array) =>
      !attributes.title.toLowerCase().includes("christmas") &&
      new Date(attributes.last_scheduled_at) > addMonths(new Date(), -6) &&
      array.findIndex(
        (el) =>
          el.attributes.title.toLowerCase().trim() ===
          attributes.title.toLowerCase().trim()
      ) === index;
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
          fetchOptions: { signal: controller.signal },
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

  static schedulesCriteria() {
    return ({ schedules }) =>
      schedules.meta?.total_count > 1 &&
      // schedules.data.some(({ attributes }) =>
      //   attributes.service_type_name.toLowerCase().includes("downtown")
      // ) &&
      schedules.data.every(
        ({ attributes }) =>
          !attributes.service_type_name.toLowerCase().includes("christmas")
      );
  }

  static mapAuthorsToArtistsQuery({ title, author }) {
    if (author == null) {
      return title;
    }
    let artist = "";
    if (
      author.includes("Brooke Fraser") ||
      author.includes("Ligertwood") ||
      author.includes("Reuben Morgan") ||
      author.includes("Aodhan King") ||
      author.includes("Houston") ||
      author.includes("Marty Sampson") ||
      author.includes("Benjamin Hastings")
    ) {
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
    } else if (
      author.includes("McClure") ||
      author.includes("Helser") ||
      author.includes("Jenn Johnson") ||
      author.includes("Brian Johnson")
    ) {
      artist = "Live Bethel";
    } else {
      artist = author.split(",")[0].split("and")[0];
    }
    return `${title} ${artist.trim()}`;
  }
}
