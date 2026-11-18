# AgriCast database (v6)

`schema.sql` is generated from `backend/app/db.py`. It was run on PostgreSQL 16 and matched what the app creates (7 tables, 5 foreign keys).
To redraw the diagram: in drawSQL create a new diagram and import `schema.sql` as PostgreSQL SQL.

```mermaid
erDiagram
    users ||--o{ farms : owns
    farms ||--o{ plantings : has
    plantings ||--o{ observations : logs
    plantings ||--o{ reminders : has
    sources ||--o{ crop_calendars : cited_by

    users { int id PK
            varchar email UK
            varchar name
            varchar password_hash
            varchar phone
            boolean sms_alerts
            timestamptz created_at }
    farms { int id PK
            int user_id FK
            varchar name
            float latitude
            float longitude
            float area_ha
            varchar county
            varchar sub_county
            varchar agro_ecological_zone
            varchar production_system }
    plantings { int id PK
            int farm_id FK
            varchar crop "text key, see crops.py"
            date planting_date
            varchar status }
    observations { int id PK
            int planting_id FK
            date observed_on
            varchar growth_stage
            float rainfall_mm
            text notes }
    reminders { int id PK
            int planting_id FK
            date due_date
            varchar text
            boolean done }
    sources { int id PK
            varchar organisation
            varchar title
            varchar url
            varchar source_document
            varchar licence
            date published_date
            date accessed_date }
    crop_calendars { int id PK
            varchar crop "text key, see crops.py"
            varchar county "null = broader region"
            varchar sub_county
            varchar agro_ecological_zone
            text administrative_areas "the source's own area text"
            varchar season
            varchar production_system "rain-fed, irrigated or not stated"
            varchar planting_start "MM-DD"
            varchar planting_end "MM-DD"
            varchar harvest_start "MM-DD"
            varchar harvest_end "MM-DD"
            int source_id FK
            varchar source_page_or_sheet
            text source_wording
            varchar reviewer_role
            varchar review_status
            date last_reviewed_at
            int version
            text notes }
```

## Not tables (by design in v6)
- **Crops:** reference data in `backend/app/crops.py` (base and upper temperature, growing degree days, sowing depth, spacing, water need, verification URLs). `plantings.crop` and `crop_calendars.crop` hold the crop key. A `crops` table with real foreign keys is a possible next step.
- **Weather:** cached in memory, not stored.
- **Alerts:** computed from reminders and the forecast, not stored.

## Changes needed in the drawSQL diagram to match v6
1. Add `observations` and `reminders` (both link to the planting).
2. Rename `crop_plans` to `plantings` and drop its `user_id`, `calendar_id` and `expected_harvest_date`; add `status`.
3. Remove `alerts`, `weather_records` and the `crops` table (or keep `crops` only as a note that it lives in code).
4. In `crop_calendars`: store the four window fields as `MM-DD` text, remove `source_name`, `source_url` and `source_document` (they live in `sources`), and add `source_page_or_sheet`, `source_wording` and `version`.
5. In `users`: replace `username`, `role`, `is_active`, `updated_at` with `name`, `phone`, `sms_alerts`.
6. In `farms`: `name` (not `farm_name`), `area_ha` (not `size_hectares`), add `production_system`, drop `created_at` and `updated_at`.
7. Use `SERIAL` ids and `INTEGER` foreign keys throughout, and remove `created_at` and `updated_at` from every table except `users.created_at`.
