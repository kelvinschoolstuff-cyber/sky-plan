# Agricast

Agricast is a Phase 1 React application that helps farmers check weather for a place before making field-work and planting plans. Users enter a place, choose from live suggestions, then review current weather, hourly conditions, a seven-day forecast, and a general weather-based field note.

This is a frontend-only project. It calls Open-Meteo directly and stores the last selected location in the browser's local storage. It does not have a Flask server, database, or user accounts.

## Run the application

```sh
npm install
npm run dev
```

Useful checks:

```sh
npm run lint
npm run build
```

## Project map

Line numbers below refer to this source snapshot and may change as the app is edited. Search for the function or component names to find code reliably if a line number moves.

| File | What it contains |
| --- | --- |
| `src/main.jsx` | React entry point. Creates the root, enables browser routing, and renders `App`. |
| `src/App.jsx` | Main app routes, reusable header/footer, About page, 404 page, location search state, forecast loading, and dashboard sections. |
| `src/services/WeatherApi.jsx` | Open-Meteo API requests: `searchLocations` for suggestions and `fetchWeather` for current/hourly/daily forecasts. |
| `src/App.css` | Dashboard, project page, navigation, suggestion list, and responsive component styles. |
| `src/index.css` | Global styles, theme variables, typography defaults, and base element rules. |
| `index.html` | Browser document title, viewport, metadata, and the React root element. |
| `package.json` | Dependencies and commands for development, linting, and production builds. |

The dashboard sections are currently kept in `Dashboard` in `src/App.jsx`; there are no separate component files under `src/components`.

## Important parts of `src/App.jsx`

- Lines 7-53: Weather-code lookup tables for readable condition names and symbols.
- Lines 55-82: Display and storage helpers, including `readSavedLocation` and `formatLocationLabel`.
- Lines 86-128: `getPlantingAdvice` checks five days of rain and temperature and returns a general field note. It is a simple heuristic, not agronomic advice.
- Lines 131-137: `formatDay` converts forecast dates into short weekday labels.
- Lines 140-164: `SiteHeader` and `SiteFooter`, shared across routes.
- Lines 167-224: `ProjectStory`, which explains the problem, app scope, walkthrough, and API choice.
- Lines 227-235: `NotFound`, shown when the URL does not match an app route.
- Lines 238-253: `Dashboard` starts with state for the location, forecast response, loading/error status, and autocomplete suggestions.
- Lines 254-283: Debounced effect that requests matching places after the user types at least two characters.
- Lines 285-302: `loadWeather` fetches forecast data, updates the UI, and remembers the selected place.
- Lines 304-328: Startup effect that reloads the last saved location's latest forecast.
- Lines 330-379: Form submission, input clearing, selection, and keyboard navigation handlers.
- Lines 382-406: Values derived from the API response for the current weather, hourly list, planting note, and date.
- Lines 409-464: Dashboard heading and accessible location search with suggestions.
- Lines 465-477: Loading, error, and first-visit prompt states.
- Lines 482-511: Current conditions and planting field note.
- Lines 514-530: Seven-day forecast.
- Lines 533-560: Hourly forecast and supporting seasonal note.
- Lines 564-575: `App` maps `/` to `Dashboard`, `/project` to `ProjectStory`, and other paths to `NotFound`.

The line references are a navigation aid only. When they become outdated, use VS Code's search for the function/component name shown above.

## How data flows

1. The user types at least two characters in the location field. `Dashboard` waits briefly, then calls `searchLocations`.
2. Open-Meteo returns matching places. The suggestion list shows the place name, region, and country.
3. Selecting a suggestion passes its coordinates to `fetchWeather`. Submitting without selecting one searches the typed name.
4. The dashboard renders the returned conditions and stores the selected location in `localStorage` as `agricast-location`.
5. On reload, the saved location is used to request the latest forecast. Clearing the search input deletes the saved location.

## API choice and limitations

Agricast uses Open-Meteo's public geocoding and forecast APIs. This is a practical Phase 1 choice because it supports place suggestions and weather forecasts without requiring an API key. The API layer is kept in `src/services/WeatherApi.jsx` so it can later be redirected to a Flask service.

The field note only considers a few forecast values. It cannot account for soil condition, crop variety, pests, water access, or local planting calendars. Treat it as general context, not a crop-specific recommendation. Check Open-Meteo's [documentation](https://open-meteo.com/en/docs) and [terms](https://open-meteo.com/en/terms) before deployment or commercial use.

## Walkthrough and reflection

For a walkthrough, enter a location, select a suggestion, compare the current, hourly, and weekly views, then refresh to demonstrate that the last location is remembered. The About link explains the project scope and technical choices.

For a personal reflection, describe what you learned, which part you found most challenging, what you are proud of, and what you would improve next. A useful next improvement would be testing search/loading/error states and the planting-note thresholds. Please make the reflection your own rather than presenting these prompts as personal experience.

## Future phases

Phase 2 can replace the direct public API request with a Flask backend while keeping the React dashboard's data shape stable. Phase 3 can add authentication and user-owned farms or saved plans. Those features are not part of this Phase 1 application.
