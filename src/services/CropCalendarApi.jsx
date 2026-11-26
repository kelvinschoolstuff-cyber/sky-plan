import { apiRequest } from "./Api";

export function getCropCalendars(filters = {}) {
  const params = new URLSearchParams();

  if (filters.crop_id) {
    params.set("crop_id", filters.crop_id);
  }

  if (filters.county) {
    params.set("county", filters.county);
  }

  if (filters.sub_county) {
    params.set("sub_county", filters.sub_county);
  }

  if (filters.season) {
    params.set("season", filters.season);
  }

  if (filters.agroecological_zone) {
    params.set("agroecological_zone", filters.agroecological_zone);
  }

  const query = params.toString();

  return apiRequest(`/api/crop-calendars${query ? `?${query}` : ""}`);
}
