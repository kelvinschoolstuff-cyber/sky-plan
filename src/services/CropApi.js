import { apiRequest } from "./Api";

export function getCrops() {
  return apiRequest("/api/crops");
}
