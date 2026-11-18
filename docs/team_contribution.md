# Team contribution map

Each person owns specific files. Props are the contract: keep them stable, and tell the lead before changing them.
Replace TM1, TM2 and TM3 with names.

| Owner | Files | Props / purpose |
|---|---|---|
| Lead | `components/Navbar.jsx` | `{ user, onLogout }`: shared navigation, rendered once above `<Routes>` in `App.jsx` |
| TM1 | `components/HourlyForecast.jsx` | `{ hourly }`: next 24 hours (`time, temp, rain, prob, code`) |
| TM1 | `components/WeeklyForecast.jsx` | `{ daily }`: 7 days (`date, min, max, rain, code`, optional `prob, wind`) |
| TM1 | `components/Guidance.jsx` | `{ items }` from the API, or `{ weather }` computed in the browser; optional `period, disclaimer` |
| TM1 | `components/SourceLink.jsx` | `{ name, url }`: external link or plain text |
| TM1 | `data/guidanceData.js` | Guidance rules and KMD source URLs |
| TM2 | `components/CropSelector.jsx` | `{ crops, value, onChange }`: `onChange` gets the crop key |
| TM2 | `components/CropInformation.jsx` | `{ crop }`: one object from `GET /crops` |
| TM2 | `components/CropFact.jsx` | `{ label, value }`: one `<dt>/<dd>` pair |
| TM3 | `components/PlantingCalendar.jsx` | `{ county, crop }`: fetches `GET /calendar` and handles loading, offline, broader-region and no-entry states |
| TM3 | `components/CalendarEntry.jsx` | `{ entry }`: one calendar record |
| Lead | `App.jsx`, `styles.css` (lead-only), `main.jsx`, `i18n.js`, `api.js`, `weather.js`, `CalendarView.jsx` (source-attribution logic), pages (`Dashboard`, `WeatherPage`, `Crops`, `Farms`, `Auth`), `Insights.jsx`, `LocationSearch.jsx`, `CountySelect.jsx`, `public/`, `locales/` | Wiring, theme, API calls, translation files |
| Lead | `backend/`, `docs/`, `docker-compose.yml`, `.env.example` | API, database, tests, data import, documents |

## Working rules
1. Show every user-facing string through `t("key")` and add the key to `locales/en.json` (and `sw.json` if you can).
2. Guidance and calendar text must stay qualified and sourced (see `team_brief_corrections.md`).
3. Do not hardcode planting dates anywhere. Dates come from the imported, source-attributed calendar.
4. Run `npm run build` before sharing a change. Backend changes need `pytest` to pass.
5. For a new style class, ask the lead.
