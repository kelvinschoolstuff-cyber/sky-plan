import { apiRequest } from "./Api";

export function getFarms() {
  return apiRequest("/api/farms");
}

export function createFarm(farmData) {
  return apiRequest("/api/farms", {
    method: "POST",
    body: JSON.stringify(farmData),
  });
}

export function updateFarm(farmId, farmData) {
  return apiRequest(`/api/farms/${farmId}`, {
    method: "PATCH",
    body: JSON.stringify(farmData),
  });
}

export function deleteFarm(farmId) {
  return apiRequest(`api/farms/${farmId}`, {
    method: "DELETE",
  });
}
