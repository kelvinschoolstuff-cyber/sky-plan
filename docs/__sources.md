# Research sources and resources

Where AgriCast's data and guidance should come from, what each source is good for, and its limits.
"Checked" means someone opened the page. Always confirm the licence, edition and update date on the actual file before reusing it.

| Source | Link | Use in AgriCast | Limits and notes |
|---|---|---|---|
| FAO Crop Calendar | https://cropcalendar.apps.fao.org/ | Reference platform for planting and harvest periods by country, crop and agro-ecological zone. Also the first place to verify crop reference values. | Searchable web platform. A documented public API for planting dates was not found. |
| KALRO / FAO Kenya Crop Calendar (XLS) | https://staging.sproutopencontent.com/dataset/kenya-crop-calendar-fao | **Loaded into the app.** 202 records for the 10 AgriCast crops, status draft. Original kept in `backend/data/source_files/`; converter in `backend/scripts/xls_to_calendar_csv.py`. | One sheet, 458 rows, 31 crops (256 rows for crops AgriCast does not cover were not converted). Organised by agro-ecological zone; each zone has a text list of old provinces and districts, so county matching is by the source's own area text only. The source does not say rain-fed or irrigated, so production system is "not stated". Listing: CC BY 4.0, updated 2022-06-09; file properties: created 2021-04-21, last saved 2021-10-04. Check Sprout for newer editions. |
| KALRO Crop Cycle resource (PDF) | https://staging.sproutopencontent.com/dataset/kenya-crop-calendar-kalro | Crop-cycle calendar to cross-check the XLS and verify crop duration. | Link supplied by the team; open it and confirm the licence and date before citing. |
| KMD Agrometeorology | https://meteo.go.ke/Services/agrometeorology/ | Official forecasts, seasonal outlooks and advisories. AgriCast links to it from every guidance item and from the seasonal outlook note. | Not a crop-calendar API. |
| KMD Monthly Agrometeorological Bulletin | https://meteo.go.ke/our-products/monthly-agrometeorological-bulletin/ | Official monthly context; linked from heavy-rain and harvest guidance. | Bulletins are published documents, not structured data. |
| Open-Meteo | https://open-meteo.com/ | Forecast, hourly forecast, historical (archive) rainfall, evapotranspiration and place search. | Free tier has usage limits and attribution requirements: keep the "Weather data by Open-Meteo.com" credit and read the terms before any commercial use. Historical rainfall is modelled, not rain-gauge data. |

## Also named in the research PDF (no links were supplied; search for the current pages)
- World Bank Data Catalog: *Crop Calendar for Africa* (FAO-derived, CC BY 4.0, 2019 coverage). Useful maize cross-check; beans are not in its crop list.
- Kenya Agricultural Observatory Platform (KAOP) / Kenya AgDataHub, MoA-INFO (Precision Development), and KALRO digital agriculture resources. These are existing services, so compare with them and never claim they do not exist.

## Not yet verified
- KEEP, the KALRO digital agriculture portal (https://keep.kalro.org/), appeared in an AI-generated overview. Open it and confirm what it offers before listing it as a source.

## What the KALRO/FAO file contains and how AgriCast uses it
- Columns used: agro-ecological zone, administrative areas, crop, season ("First season", "Second season" or not stated), planting onset and end, harvesting onset and end, cropping-cycle length and the zone's farming notes.
- Dates are `DD/MM` in the source and are stored as `MM-DD`. No date is changed, averaged or inferred.
- Crop names mapped to AgriCast: Maize, Bean common dry (beans), Sorghum, Mungbean (green grams, *Vigna radiata*), Potato (Irish potatoes), Wheat common, Tomato, Kale, Cabbage common, Onion.
- Not used: 21 other crops in the file (for example sweet potato, millet, cassava, sunflower) and Chinese cabbage.
- Limits: zone-level, not county-level; older province and district names; no second source yet; the 2019 World Bank maize calendar and KALRO's crop-cycle PDF are the planned cross-checks.

## How sources enter the app
1. Download the file by hand and keep the original unchanged as an audit copy.
2. Fill `backend/data/calendar_template.csv` with one row per record, including source, page or sheet, dates, licence and original wording.
3. Import with `python -m app.calendar_tools your_file.csv`. The app shows the source, licence, dates and review status next to every entry.
