# AgriCast: Kenya agricultural planning and weather advisory

Choose a location and crop, see the source-attributed planting calendar, the forecast and qualified general guidance, then save your plan.
Planning support only, not professional agronomic advice. Backend: FastAPI. Frontend: React (JavaScript). Nothing is deployed.

## Quick start on Ubuntu
```bash
unzip agricast.zip && cd agricast
sudo apt update && sudo apt install -y python3 python3-venv python3-pip curl
node -v        # needs 18 or newer; if missing, install Node 20:
#   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
./run_local.sh
```
Open **http://localhost:5173**. The API and its Swagger docs are at http://localhost:8000/docs. Press Ctrl+C to stop.
This uses a SQLite file (`agricast.db`), so no database setup is needed. The real KALRO/FAO calendar records load automatically on first start.

## With Docker (PostgreSQL)
`cp .env.example .env`, then `docker compose up --build`. Web app http://localhost:5173, API http://localhost:8000. The calendar records load automatically on first start.

## Run the parts separately
- Backend: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload` (set `DATABASE_URL`; SQLite or PostgreSQL).
- Frontend: `cd frontend && npm install && npm run dev`. It also works alone (frontend-only mode): weather, guidance, water balance and crop facts work; the calendar, accounts and farms need the backend.
- Tests: `cd backend && pytest -v` and `cd frontend && npm test`.

## If something does not work
- **Calendar says "No planting calendar is available":** the KALRO/FAO source does not name that county. Try Uasin Gishu, Nakuru, Meru or Kiambu with Maize. If the calendar is empty for every county, the data did not load: check the backend log for "Loaded 202 KALRO/FAO calendar records" and that `AUTO_LOAD_CALENDAR` is not 0.
- **Backend shows `400 Bad Request` on `OPTIONS` lines:** the page was opened from an address the API does not allow. Open http://localhost:5173 (the API accepts any localhost port).
- **Place search says "Failed to fetch":** it now goes through the backend; make sure the backend is running (http://localhost:8000/health) and restart it after updating.

## Crop calendar data (real, draft)
On first start the app loads **202 real records** from the KALRO/FAO "Kenya Crop Calendar from FAO" spreadsheet (CC BY 4.0, via the Sprout platform) for
maize, beans, sorghum, green grams, potatoes, wheat, tomato, kale, cabbage and onion. They are marked **draft**: imported as published, not yet cross-checked
or locally reviewed. The original file is kept unchanged in `backend/data/source_files/`.

**How the data is organised.** The source gives planting and harvest periods by **agro-ecological zone**, with a text list of old provinces and districts
for each zone. It does not give dates by county, so AgriCast never invents county dates. If you pick a county that the source names, you see the matching
zones' entries (labelled zone-level) and can narrow to your own zone. If the source does not name your county, the app says there is no calendar entry
and links to official sources.

- Reconvert or update: `pip install -r backend/requirements-data.txt`, then `python backend/scripts/xls_to_calendar_csv.py <file.xls> backend/data/kalro_fao_kenya_calendar.csv`.
- Import any other source: fill `backend/data/calendar_template.csv` and run `python -m app.calendar_tools file.csv` inside `backend`.
- Start with an empty calendar: `AUTO_LOAD_CALENDAR=0`. `backend/data/calendar_sample.csv` is a SAMPLE test fixture (skipped unless `--sample`; `DEMO_SAMPLE_CALENDAR=1`
  loads it only when the calendar is empty, with a red DEMO MODE banner). Never present sample dates as real.
- Source details and limits: `docs/__sources.md`.

## Crop information
Crop facts come from `backend/app/crops.py`. Draft growing notes for maize, beans, sorghum, green grams and Irish potatoes are shown with a
"not yet verified" warning; the other crops show "No growing notes for this crop yet." Values are approximate and unreviewed (`docs/crop_reference_review.csv`).

## Resources and team docs
Research sources: `docs/__sources.md` (FAO Crop Calendar, KALRO/FAO Kenya crop calendar, KALRO crop cycle, KMD agrometeorology and bulletin, Open-Meteo).
Overview: `SYSTEM_OVERVIEW.md`. Demo: `docs/DEMO_SCRIPT.md`. Database: `docs/schema.sql`, `docs/database_diagram.md`.
Testing: `docs/usability_test_plan.md`, `docs/usability_report_template.md`, `docs/expert_review_form.csv`. Team: `docs/team_contribution.md`, `docs/team_brief_corrections.md`.
Weather data by Open-Meteo.com.
