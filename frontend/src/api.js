// VITE_API_URL (or VITE_API_BASE_URL) points at the FastAPI backend; default is the local backend.
const BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

import { FALLBACK_COUNTIES, FALLBACK_CROPS } from "./data/fallbackData";

export const API_BASE = BASE;
const QKEY = "queue";
const queue = () => JSON.parse(localStorage.getItem(QKEY) || "[]");

async function req(path, { method = "GET", body, queueable = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body && JSON.stringify(body) });
  } catch {
    if (queueable) {  // offline: keep the record on this device and send it later
      localStorage.setItem(QKEY, JSON.stringify([...queue(), { path, body }]));
      return { queued: true };
    }
    const e = new Error(`Cannot reach the AgriCast API at ${BASE}. Start the backend (agricast-backend) or check VITE_API_URL.`);
    e.offline = true;
    throw e;
  }
  if (!res.ok) {
    let msg = "Something went wrong. Try again.";
    try {
      const j = await res.json();
      if (typeof j.detail === "string") msg = j.detail;
      else if (Array.isArray(j.detail)) msg = j.detail.map((d) => d.msg).join(". ");
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

export const pending = () => queue().length;
export async function flushQueue() {
  const q = queue();
  if (!q.length || !localStorage.getItem("token")) return 0;
  const rest = [];
  for (const it of q) {
    try { await req(it.path, { method: "POST", body: it.body }); } catch (e) { if (e.offline) rest.push(it); }
  }
  localStorage.setItem(QKEY, JSON.stringify(rest));
  return q.length - rest.length;
}

// Frontend-only mode: if the API is not running, weather and water balance come straight from Open-Meteo.
async function directWaterBalance(lat, lon) {
  const q = new URLSearchParams({ latitude: lat, longitude: lon, timezone: "auto", forecast_days: 7, daily: "precipitation_sum,et0_fao_evapotranspiration" });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!r.ok) throw new Error("Could not load the weather. Try again.");
  const d = (await r.json()).daily;
  let cum = 0, run = 0, longest = 0, rain = 0, et0 = 0;
  const days = d.time.map((date, i) => {
    const p = d.precipitation_sum[i] || 0, e = d.et0_fao_evapotranspiration[i] || 0;
    cum += p - e; rain += p; et0 += e; run = p < 1 ? run + 1 : 0; longest = Math.max(longest, run);
    return { date, rain: +p.toFixed(1), et0: +e.toFixed(1), balance: +(p - e).toFixed(1), cumulative: +cum.toFixed(1) };
  });
  return { days, rain_total: +rain.toFixed(1), et0_total: +et0.toFixed(1), longest_dry_run: longest,
    summary: `Next 7 days: about ${rain.toFixed(0)} mm of rain against ${et0.toFixed(0)} mm of reference evapotranspiration (water a well-watered grass surface could lose). The longest forecast dry run is ${longest} day(s).`,
    note: "Reference evapotranspiration is not your crop's exact water use, and soil, slope and crop stage matter. Use it as a rough guide alongside local advice." };
}

export const api = {
  health: () => req("/health"),
  geocode: (q) => req(`/geocode?q=${encodeURIComponent(q)}`),
  weather: (lat, lon) => req(`/weather?lat=${lat}&lon=${lon}`),
  crops: () => req("/crops").catch(() => FALLBACK_CROPS),
  counties: () => req("/counties").catch(() => FALLBACK_COUNTIES),
  sources: () => req("/sources"),
  calendar: (crop, county) => req(`/calendar?crop=${crop}${county ? `&county=${encodeURIComponent(county)}` : ""}`),
  alerts: () => req("/alerts"),
  setStatus: (id, status) => req(`/plantings/${id}`, { method: "PATCH", body: { status } }),
  reminders: (id) => req(`/plantings/${id}/reminders`),
  addReminder: (id, body) => req(`/plantings/${id}/reminders`, { method: "POST", body, queueable: true }),
  toggleReminder: (id) => req(`/reminders/${id}`, { method: "PATCH" }),
  advice: (crop, lat, lon) => req(`/advice?crop=${crop}&lat=${lat}&lon=${lon}`),
  login: (body) => req("/auth/login", { method: "POST", body }),
  register: (body) => req("/auth/register", { method: "POST", body }),
  farms: () => req("/farms"),
  addFarm: (body) => req("/farms", { method: "POST", body }),
  deleteFarm: (id) => req(`/farms/${id}`, { method: "DELETE" }),
  addPlanting: (farmId, body) => req(`/farms/${farmId}/plantings`, { method: "POST", body }),
  progress: (id) => req(`/plantings/${id}/progress`),
  observations: (id) => req(`/plantings/${id}/observations`),
  addObservation: (id, body) => req(`/plantings/${id}/observations`, { method: "POST", body, queueable: true }),
  onset: (lat, lon, season) => req(`/climate/onset?lat=${lat}&lon=${lon}&season=${season}`),
  waterBalance: (lat, lon) => req(`/water-balance?lat=${lat}&lon=${lon}`).catch(() => directWaterBalance(lat, lon)),
  rainCheck: (id) => req(`/plantings/${id}/rain-check`),
  me: () => req("/me"),
  updateMe: (body) => req("/me", { method: "PATCH", body }),
};
