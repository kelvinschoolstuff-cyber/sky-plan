# Agricast

Agricast helps farmers check weather for a place before making field-work and planting plans. Users enter a place, choose from live suggestions, then review current weather, hourly conditions, a seven-day forecast, and a general weather-based field note. A Flask API provides email/password signup, login, logout, and session checking.

The React application calls Open-Meteo directly and stores the last selected location in the browser's local storage. The Flask API stores user accounts in SQLite and stores sessions server-side.

## Run the frontend

```sh
npm install
npm run dev
```

The Vite development server proxies `/api` requests to `http://127.0.0.1:5000`.

## Run the API

Use Python 3.10 or later:

```sh
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r backend/requirements-dev.txt
python3 -m flask --app backend:create_app run --debug
```

In another terminal, run the frontend with `npm run dev`. The backend creates its SQLite database and server-side session directory in `backend/instance/`.

Set `SECRET_KEY` to a persistent, randomly generated secret before deployment. `APP_ENV=production` requires it. Configure `CORS_ORIGINS` as a comma-separated list of exact frontend origins (the local Vite origins are allowed by default). For HTTPS deployments, set `SESSION_COOKIE_SECURE=true`; cookies are HTTP-only and use `SameSite=Lax` by default. Keep the frontend and API on the same site when using the default cookie policy. Server-side session data is stored in `backend/instance/sessions/` by default.

## Authentication API

All endpoints accept and return JSON:

| Endpoint | Success response | Errors |
| --- | --- | --- |
| `POST /api/signup` | `201 {"user":{"id":1,"username":"...","email":"..."}}` | `400` invalid input, `409` duplicate username/email |
| `POST /api/login` | `200 {"user":{"id":1,"username":"...","email":"..."}}` | `400` missing input, generic `401` invalid credentials |
| `POST /api/logout` | `200 {"message":"Logged out successfully."}` | — |
| `GET /api/check_session` | `200 {"authenticated":true,"user":{...}}` or `200 {"authenticated":false,"user":null}` | — |

Usernames are 3–32 characters, email addresses are limited to 254 characters, and passwords must be at least 8 characters and no more than 72 UTF-8 bytes (the bcrypt input limit). Usernames and email addresses are unique without regard to case. Password hashes are never included in API responses. Protected Flask views can use `login_required` from `backend.auth`; unauthenticated requests receive `401`.

## Checks

```sh
npm run lint
npm run build
python3 -m pytest backend/tests
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
| `backend/__init__.py` | Flask app factory, CORS/session configuration, and database initialization. |
| `backend/auth.py` | Authentication endpoints, validation, and the `login_required` decorator. |
| `backend/models.py` | SQLAlchemy user model and stored password hash. |
| `backend/tests/test_auth.py` | Signup, login, session, logout, and protected-route tests. |
| `backend/requirements.txt` | Flask API runtime dependencies. |

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

The Flask backend is the first step toward user-owned farms or saved plans. The current React screens do not yet include signup or login forms, and the weather dashboard remains independent of user accounts.
