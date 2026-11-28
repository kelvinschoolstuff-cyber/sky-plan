import { apiRequest } from "./Api";

export function getPlantingPlans(filters = {}) {
  const params = new URLSearchParams();

  if (filters.page) params.set("page", filters.page);
  if (filters.per_page) params.set("per_page", filters.per_page);
  if (filters.farm_id) params.set("farm_id", filters.farm_id);

  const query = params.toString();

  return apiRequest(`/api/planting-plans${query ? `?${query}` : ""}`);
}

export function getPlantingPlan(planId) {
  return apiRequest(`/api/planting-plans/${planId}`);
}

export function createPlantingPlan(farmId, planData) {
  return apiRequest(`/api/farms/${farmId}/planting-plans`, {
    method: "POST",
    body: JSON.stringify(planData),
  });
}

export function updatePlantingPlan(planId, planData) {
  return apiRequest(`/api/planting-plans/${planId}`, {
    method: "PATCH",
    body: JSON.stringify(planData),
  });
}

export function deletePlantingPlan(planId) {
  return apiRequest(`/api/planting-plans/${planId}`, {
    method: "DELETE",
  });
}
