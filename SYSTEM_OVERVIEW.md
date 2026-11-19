# AgriCast system overview

Climate-smart planning and weather advisory for smallholder farmers in Kenya. Planning support, not professional agronomic advice.

## Architecture
- **Frontend:** React (JavaScript, Vite) at http://localhost:5173. Pages are routed with React Router; one shared `components/Navbar.jsx` is rendered once above `<Routes>` in `App.jsx`.
- **Backend:** FastAPI at http://localhost:8000 (Swagger at /docs). It caches and serves the weather (`/weather`), calculates growing degree days and harvest windows, and serves the source-attributed crop calendar (`/calendar`, `/sources`).
- **Database:** PostgreSQL (Docker). Version 1 and 2 databases are upgraded automatically on startup.
- **External data:** Open-Meteo (forecast, archive rainfall, evapotranspiration, place search). Official advice links go to KMD and FAO.

## Run it
- **No Docker (easiest):** `./run_local.sh` starts the API (SQLite) and the web app. See README.md.
1. `cp .env.example .env` (for a presentation, set `DEMO_SAMPLE_CALENDAR=1`, see below)
2. `docker compose up --build` starts the database, API and web app.
3. Open http://localhost:5173 (app) and http://localhost:8000/docs (API).

Without Docker: start PostgreSQL, set `DATABASE_URL`, run `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`, then `cd frontend && npm install && npm run dev`.

## What to look at
- **Attribution:** every guidance item, crop page, calendar entry and the Crops page "Calendar sources" list shows where information came from, through `components/SourceLink.jsx`, `CalendarView.jsx` and `GET /sources`. Links point to official sources (KMD, FAO, KALRO via Sprout); AgriCast's own thresholds are labelled "not yet reviewed by an agronomist".
- **Components (10):** `Navbar`, `HourlyForecast`, `WeeklyForecast`, `Guidance`, `SourceLink` (TM1); `CropSelector`, `CropInformation`, `CropFact` (TM2); `PlantingCalendar`, `CalendarEntry` (TM3). Owners and props: `docs/team_contribution.md`.
- **Empty and error states:** no calendar entry, broader-region entry, API offline, no crops, no sources, unknown URL, and a top-level error screen.
- **Tests:** `cd backend && pytest -v` (backend logic, calendar rules, endpoints) and `cd frontend && npm test` (screens, routing, empty states, attribution).
- **Beyond a basic weather app:** growth tracker with a harvest date range, planting date check, local rainfall onset history, 7-day water balance, your rain gauge vs modelled rain, reminders and alerts, offline use, Kiswahili (draft), optional SMS alerts.

## Crop information
Crop facts and base parameters come from `backend/app/crops.py` through `GET /crops`. Draft growing notes (duration, temperature, rainfall, soil, water, management) exist for maize, beans, sorghum, green grams and Irish potatoes and are shown with a "draft, not yet verified" warning. Wheat and the vegetables show "No growing notes for this crop yet." The API is the source of truth; `frontend/src/data/fallbackData.js` is an offline copy.

## Running the frontend without the backend
`cd frontend && npm run dev` works alone. A banner explains the limits: weather, general guidance, the water balance, crop facts and counties still work; the planting calendar, rainfall onset, accounts and farm records need the backend.

## Calendar data
The app loads 202 real KALRO/FAO records on first start (CC BY 4.0, status "draft"). They are organised by agro-ecological zone, with the source's own text listing
old provinces and districts, so AgriCast matches a county only where that text names it, labels the entries zone-level and lets the farmer pick their zone. It never
turns a zone into county dates. Counties the source does not name show "no planting calendar available" with links to official sources. The original spreadsheet and the
converter script are in `backend/data/source_files/` and `backend/scripts/`. A SAMPLE fixture exists only for testing the importer (`DEMO_SAMPLE_CALENDAR=1` with an empty calendar).

## What has and has not been verified
- Verified: 29 backend tests; 21 frontend tests; every API endpoint against a real PostgreSQL 16 (including upgrading a version 1 database); the frontend build; Open-Meteo parameter names against its documentation.
- Verified with simulated weather only: forecast, guidance, growth tracker and onset (the build environment had no access to Open-Meteo).
- Not yet run: `docker compose up` itself, the app in a real browser, live Open-Meteo calls, SMS against the live service.
- Not done: cross-checking the calendar against a second source, local expert review of the calendar, agronomist review of crop values, user testing.
