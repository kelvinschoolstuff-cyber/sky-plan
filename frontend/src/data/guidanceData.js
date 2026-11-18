// TM1. Client-side guidance rules, so the dashboard still gives qualified guidance when the API is offline.
// Rules are general screening thresholds, NOT agronomic prescriptions. The links point to OFFICIAL advice sources.
export const SOURCES = {
  agromet: { name: "KMD Agrometeorology", url: "https://meteo.go.ke/Services/agrometeorology/" },
  bulletin: { name: "KMD Monthly Agrometeorological Bulletin", url: "https://meteo.go.ke/our-products/monthly-agrometeorological-bulletin/" },
  faoCalendar: { name: "FAO Crop Calendar", url: "https://cropcalendar.apps.fao.org/" },
  openMeteo: { name: "Open-Meteo", url: "https://open-meteo.com/" },
};
export const BASIS = "AgriCast general guidance (not yet reviewed by an agronomist)";
export const DISCLAIMER =
  "General information based on the next 7 days of forecast. It is not a guarantee, it does not replace advice from your county extension officer, and screening thresholds are rough, not agronomic rules.";

const total = (d) => d.reduce((s, x) => s + (x.rain || 0), 0);
const label = (iso) => new Date(iso + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export const RULES = [
  { situation: "Rainfall expected", level: "info", source: "agromet",
    run: (d) => (total(d) >= 20 ? [`About ${total(d).toFixed(0)} mm of rain is forecast over the next 7 days. Review land preparation and planting plans against the crop calendar for your county.`] : []) },
  { situation: "Little rain forecast", level: "info", source: "agromet",
    run: (d) => (total(d) < 5 ? [`Only ${total(d).toFixed(0)} mm is forecast over the next 7 days. This is a short-term view, not a season outlook. Monitor soil moisture and consider locally recommended water-conservation practices.`] : []) },
  { situation: "Heavy rainfall", level: "warn", source: "bulletin",
    run: (d) => d.filter((x) => x.rain >= 30).map((x) => `${x.rain.toFixed(0)} mm is forecast on ${label(x.date)}. Consider drainage, erosion prevention and waterlogging risks.`) },
  { situation: "High temperatures", level: "warn", source: "agromet",
    run: (d, c) => d.filter((x) => x.max >= c.heatAt).map((x) => `A high of ${Math.round(x.max)}°C is forecast on ${label(x.date)}. Monitor crops for heat stress and follow locally appropriate water-management guidance.`) },
  { situation: "Cold night", level: "warn", source: "agromet",
    run: (d) => d.filter((x) => x.min <= 2).map((x) => `A low of ${Math.round(x.min)}°C is forecast on ${label(x.date)}. Check whether young plants need protection.`) },
  { situation: "Harvest period approaching with rain forecast", level: "warn", source: "bulletin",
    run: (d, c) => (c.percent >= 90 && total(d) >= 20 ? ["Crop growth looks close to maturity and rain is forecast. Review crop maturity and harvesting plans to reduce weather-related losses."] : []) },
];

/** weather = { daily: [{ date, max, min, rain }] } from getForecast(). ctx = { heatAt, percent }. */
export function guidanceFromWeather(weather, ctx = {}) {
  const days = (weather?.daily || []).slice(0, 7);
  const c = { heatAt: 33, percent: null, ...ctx };
  return RULES.flatMap((r) => r.run(days, c).map((message) => ({
    situation: r.situation, level: r.level, message, basis: BASIS, source_name: SOURCES[r.source].name, source_url: SOURCES[r.source].url,
  })));
}
