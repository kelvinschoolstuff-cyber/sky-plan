# AgriCast demo script (about 8 minutes)

## Before you start (do this once, with internet)
1. Run `./run_local.sh` (or `cp .env.example .env && docker compose up --build`). The real KALRO/FAO calendar records load automatically.
2. Open http://localhost:5173. No red DEMO MODE banner should show (that banner means sample placeholder data is loaded).
3. Pre-create a demo account and one farm in Nakuru county with a maize planting about a month ago, so My Farm is not empty.
4. Keep a second browser tab on http://localhost:8000/docs.
Backup if the backend will not start: the frontend runs alone (`cd frontend && npm run dev`); weather, guidance, water balance and crop facts still work, and a banner explains what needs the backend.
Backup if the internet fails: the Crops page, calendar screens and the browser-side guidance fallback still work; say the live forecast needs a connection.

## Flow
1. **Problem (30 s).** Farmers need to know what the weather means for their crop, not only the forecast. Say plainly that KMD, KALRO, KAOP and MoA-INFO already exist; AgriCast is a focused planning workflow and prototype.
2. **Dashboard, six steps (2 min).** Search a place, pick the county and maize. Show the calendar, the forecast, the guidance, then "save your plan". Point to the source links on every item and the line "not a guarantee".
3. **Calendar honesty (1 min).** Pick Uasin Gishu and Maize: the source names the county in several agro-ecological zones, so the app shows zone-level entries and asks which zone the farm is in. Choose one and show the source, licence and "draft" status. Then pick a county the source does not name (for example Nairobi): "No planting calendar available" with official links. Say that AgriCast never turns a zone into county dates.
4. **Weather page (1 min).** Hourly and 7-day forecast, 7-day water balance, rainfall onset history. Stress that these are indicative and the seasonal outlook comes from KMD.
5. **Crops page (30 s).** Crop information with "not yet reviewed" flags, and the Calendar sources list.
6. **My Farm (2 min).** Log in. Show the growth tracker and harvest date range, planting date check, reminders, alerts, an observation with rainfall, and the rain gauge versus model comparison.
7. **Behind the scenes (1 min).** `/docs` in Swagger, `pytest` green, one shared Navbar and 10 components with named owners.

## Say these limitations out loud
- The calendar is real KALRO/FAO data but marked draft: it is by agro-ecological zone (not county), it has not been cross-checked against a second source, and no expert has reviewed it.
- Crop reference values are approximate and unreviewed; the harvest estimate is indicative.
- No user testing or expert review has been done yet; the plan is in `docs/usability_test_plan.md`.
- Kiswahili is a draft; SMS alerts are opt-in and untested against the live service.

## Likely questions
- *How is this different from KMD or MoA-INFO?* A single visual workflow with visible sources, a farm record and tracking; they are the authoritative services and AgriCast links to them.
- *Where do the dates come from?* Only from imported, source-attributed records; the importer rejects rows without a source.
- *Can a farmer rely on the guidance?* It is general, labelled as such, and points to official advice.
- *What would you do next?* Load and review the real calendar, agronomist review, user testing, Swahili review.
