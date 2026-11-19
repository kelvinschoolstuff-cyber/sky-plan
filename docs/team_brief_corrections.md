# Corrections to the team brief

Written from the project proposal and the Kenya research PDF, not from the original brief itself. Compare each point with your copy of the brief and edit as needed.

1. **Backend is FastAPI (not Flask), with PostgreSQL.** The research PDF mentions Flask and SQLite; the project now uses FastAPI and PostgreSQL.
2. **Do not say farmers have no tools.** KAOP / Kenya AgDataHub, KALRO resources, MoA-INFO and KMD already provide forecasts and advice. AgriCast is a focused planning workflow and a student prototype.
3. **There is no verified public FAO Crop Calendar API.** Use the KALRO/FAO spreadsheet and PDF as downloaded files, imported through the CSV importer.
4. **Never infer county dates from a national or other-county calendar.** If a source only covers a broader region, show that region and say so. If there is no entry, say so.
5. **Guidance is qualified, not an instruction.** Use words like "consider" and "review". Never write "Water today" or "Plant now". Every guidance item shows its basis and a link to official advice.
6. **A 7-day forecast cannot predict the season.** Keep forecasts, seasonal outlooks, historical context and general guidance visibly separate. Seasonal outlooks come from KMD.
7. **Crop reference values are approximate and unreviewed.** Do not present them as facts. `docs/crop_reference_review.csv` tracks each value until an agronomist confirms it.
8. **SAMPLE data is never real.** `backend/data/calendar_sample.csv` only tests the importer and screens. The real calendar is the KALRO/FAO import (status draft).
9. **Source coverage differs by crop.** The KALRO/FAO file covers all 10 AgriCast crops (green grams appear as "Mungbean") but is by agro-ecological zone, not county. The World Bank dataset has no beans. Say "no verified entry" rather than filling a gap.
10. **Do not claim expert validation.** Record who reviewed what in the review fields. If no expert was reached, state it as a limitation.
11. **Attribution.** Keep the "Weather data by Open-Meteo.com" credit and respect each source's licence.
12. **Shared files.** `App.jsx` and `styles.css` are lead-only. Ask the lead for navigation or style changes.
