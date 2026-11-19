// Weather comes straight from Open-Meteo (free, no API key). Attribution: https://open-meteo.com
const WMO = [
  [[0], "Clear sky"], [[1, 2, 3], "Partly cloudy"], [[45, 48], "Fog"],
  [[51, 53, 55, 56, 57], "Drizzle"], [[61, 63, 65, 66, 67], "Rain"],
  [[71, 73, 75, 77], "Snow"], [[80, 81, 82], "Showers"], [[95, 96, 99], "Thunderstorm"],
];
export const describe = (code) => WMO.find(([codes]) => codes.includes(code))?.[1] ?? "Unknown";

/** Place search through AgriCast's API; if it is unreachable, ask Open-Meteo directly. */
export async function geocode(name) {
  try { return await api.geocode(name); } catch { return geocodeDirect(name); }
}

export async function geocodeDirect(name) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5`);
  if (!r.ok) throw new Error("Place search failed. Try again.");
  const j = await r.json();
  return (j.results || []).map((p) => ({
    name: [p.name, p.admin1, p.country].filter(Boolean).join(", "), lat: p.latitude, lon: p.longitude,
  }));
}

import { api } from "./api";

/** Forecast through AgriCast's own API (backend caches Open-Meteo). If the backend is unreachable, ask Open-Meteo directly. */
export async function getForecast(lat, lon) {
  try { return await api.weather(lat, lon); } catch { return getForecastDirect(lat, lon); }
}

export async function getForecastDirect(lat, lon) {
  const q = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: "auto", forecast_days: 7, forecast_hours: 24, hourly: "temperature_2m,precipitation_probability,precipitation,weather_code",
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code",
  });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!r.ok) throw new Error("Could not load the weather. Try again.");
  const j = await r.json();
  const d = j.daily;
  return {
    current: j.current,
    hourly: j.hourly.time.map((time, i) => ({ time, temp: j.hourly.temperature_2m[i], prob: j.hourly.precipitation_probability[i], rain: j.hourly.precipitation[i], code: j.hourly.weather_code[i] })), from: d.time[0], to: d.time[d.time.length - 1],
    daily: d.time.map((date, i) => ({
      date, max: d.temperature_2m_max[i], min: d.temperature_2m_min[i], rain: d.precipitation_sum[i],
      prob: d.precipitation_probability_max[i], wind: d.wind_speed_10m_max[i], code: d.weather_code[i],
    })),
  };
}
