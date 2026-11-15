# Agricast

Agricast is a Phase 1 React frontend for farmers who want to use local weather when planning field work. Search for a city or town to see current conditions, an hourly forecast, a 7-day forecast, and a simple weather-based planting note. A first-time visitor enters a location; after a successful search, the last location is remembered in that browser and its forecast loads on future visits.

## Weather API

The frontend uses [Open-Meteo](https://open-meteo.com/), combining its geocoding API with its forecast API. It is a suitable Phase 1 choice because it is publicly accessible without an API key, supports location search, and provides current, hourly, and daily forecast data. The app requests temperature, humidity, wind, precipitation, and weather codes.

Weather-based planting notes are general prompts, not crop-specific agronomic recommendations. Farmers should also consider soil moisture, local planting calendars, seed varieties, and advice from local agricultural services. Review Open-Meteo's [terms](https://open-meteo.com/en/terms) before deployment or commercial use.

## Run locally

```sh
npm install
npm run dev
```

Useful checks:

```sh
npm run lint
npm run build
```

## Phase 1 boundary and future growth

The UI is kept separate from API access in `src/services/WeatherApi.jsx`. In Phase 2, this service can be changed to request equivalent data from a Flask backend, while the React dashboard continues consuming a stable weather-data shape. Phase 3 can add authentication and user-owned farms, saved locations, and planting plans through that backend. This phase has no backend, database, or user accounts; only the last searched location is stored locally in the browser.

## Walkthrough

1. Start the app and explain the audience: farmers checking local weather before field work.
2. Enter a town and show current conditions, then compare the hourly and seven-day forecasts. Refresh to demonstrate that the last successful location is remembered.
3. Explain that the field note is a simple temperature-and-rain heuristic, not a crop-specific prediction.
4. Describe the Open-Meteo choice: public forecast and geocoding endpoints, no API key, and a service module that can later call a Flask API.
5. Show the **Project** route for the scope, implementation decisions, and limitations.

## Reflection draft

Personalize this before submitting so it reflects your own development experience:

- **What I am proud of:** Turning live weather data into a readable planning view with location search, current conditions, hourly and weekly forecasts, and a visible caveat around planting guidance.
- **A technical decision:** Open-Meteo keeps Phase 1 usable without credentials, while `src/services/WeatherApi.jsx` isolates API calls from the React presentation.
- **A limitation or growth area:** The current planting note uses broad thresholds and does not model soil, crop variety, or local seasons. It needs validation with local agricultural expertise before anyone should rely on it for a planting decision.
- **A next step:** Add focused tests for loading, failed location searches, and recommendation thresholds. In a later phase, replace the public API call with the planned Flask service; keep accounts and saved plans out of Phase 1.
