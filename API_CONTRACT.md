# AgriCast Kenya — Phase 2 API Contract

**Status:** Team implementation agreement (revised initial version)  
**Backend:** Flask + Flask-SQLAlchemy + Flask-Migrate + PostgreSQL  
**Frontend:** React + Vite  
**Authentication:** Server-side Flask sessions using a browser session cookie

> This document is the shared technical source of truth for Phase 2 API implementation. All contributors should follow it. Any proposed change to models, endpoint paths, payloads, response formats, authentication, database schema, or ownership rules must be discussed with the team lead before implementation.

---

## 1. Scope and architecture

Phase 2 extends the existing AgriCast frontend and backend with persistent user-managed farm and planting-plan data, crop reference data, and agricultural crop-calendar information.

- Keep the existing external weather API integration unless the assignment explicitly requires replacing it.
- The Flask API manages users, farms, planting plans, crops, crop calendars, and source metadata.
- PostgreSQL stores application data.
- React communicates with Flask using JSON over HTTP.
- Authentication uses Flask sessions; the browser must send and receive cookies on API requests.
- Crop and crop-calendar information is reference data, not user-owned data.
- Planting plans are user-managed data associated with farms and crops.

### Existing backend foundation

The repository currently has an application factory, shared SQLAlchemy/Migrate/Bcrypt extensions, configuration, and the initial User, Farm, and PlantingPlan models.

The team lead coordinates shared model changes, migrations, application-factory changes, configuration, and integration.

---

## 2. Database model contract

The following models and relationships form the agreed database structure.

### User

| Field           | Type        | Rules                           |
| --------------- | ----------- | ------------------------------- |
| `id`            | Integer     | Primary key                     |
| `username`      | String(80)  | Required, unique                |
| `email`         | String(120) | Required, unique                |
| `password_hash` | String(255) | Required; never returned by API |

Relationship: one User owns many Farms.

### Farm

| Field                 | Type        | Rules                              |
| --------------------- | ----------- | ---------------------------------- |
| `id`                  | Integer     | Primary key                        |
| `name`                | String(120) | Required                           |
| `location`            | String(150) | Required                           |
| `county`              | String(100) | Required                           |
| `agroecological_zone` | String(120) | Optional                           |
| `user_id`             | Integer     | Required foreign key to `users.id` |
| `created_at`          | DateTime    | Set by backend                     |

Relationship: one Farm belongs to one User and can contain many PlantingPlans.

### Crop

Crop represents a crop supported by AgriCast and its general agricultural information.

| Field                   | Type                                  | Rules       |
| ----------------------- | ------------------------------------- | ----------- |
| `id`                    | Integer                               | Primary key |
| `name`                  | String                                | Required    |
| `description`           | Text                                  | Optional    |
| `growing_duration`      | String or appropriate structured type | Optional    |
| `suitable_temperature`  | Text or appropriate structured type   | Optional    |
| `rainfall_requirements` | Text                                  | Optional    |
| `soil_requirements`     | Text                                  | Optional    |
| `water_requirements`    | Text                                  | Optional    |
| `management_practices`  | Text                                  | Optional    |

Crop names must be unique where appropriate.

Relationship: one Crop can be associated with many PlantingPlans and many CropCalendars.

Crop information must be presented as general guidance and must not be represented as a guarantee of suitability for every farm or season.

### Source

Source stores attribution and traceability metadata for crop and crop-calendar information.

| Field            | Type           | Rules                        |
| ---------------- | -------------- | ---------------------------- |
| `id`             | Integer        | Primary key                  |
| `organisation`   | String         | Required                     |
| `title`          | String         | Required                     |
| `url`            | String         | Optional where no URL exists |
| `licence`        | String         | Optional                     |
| `published_date` | Date or String | Optional                     |
| `accessed_date`  | Date or String | Optional                     |
| `notes`          | Text           | Optional                     |

Sources must not be fabricated. Record source information only where it can be reasonably verified.

### CropCalendar

CropCalendar represents sourced planting and harvesting guidance relevant to a crop and geographic context.

| Field                 | Type           | Rules                                       |
| --------------------- | -------------- | ------------------------------------------- |
| `id`                  | Integer        | Primary key                                 |
| `crop_id`             | Integer        | Required foreign key to `crops.id`          |
| `county`              | String         | Optional                                    |
| `sub_county`          | String         | Optional                                    |
| `geographic_coverage` | String         | Optional                                    |
| `agroecological_zone` | String         | Optional                                    |
| `season`              | String         | Optional                                    |
| `production_system`   | String         | Optional                                    |
| `planting_start`      | String or Date | Optional                                    |
| `planting_end`        | String or Date | Optional                                    |
| `harvest_start`       | String or Date | Optional                                    |
| `harvest_end`         | String or Date | Optional                                    |
| `source_id`           | Integer        | Required foreign key to `sources.id`        |
| `source_reference`    | String         | Optional source page, table, or section     |
| `verification_status` | String         | Required; defaults to agreed initial status |
| `reviewed_at`         | DateTime       | Optional                                    |
| `notes`               | Text           | Optional                                    |

Calendar date fields may represent months, date ranges, or seasonal windows rather than exact dates. The implementation must preserve the nature of the source data and must not falsely convert approximate seasonal guidance into exact dates.

The team must agree on the final representation of planting and harvest windows before implementing the model.

Suggested verification statuses:

- `verified`
- `unverified`
- `needs_review`

The team must agree on these values before enforcing them in the database or API.

Relationship: one Crop can have many CropCalendars. One Source can support many CropCalendars.

### PlantingPlan

PlantingPlan represents a user's planned or ongoing crop production activity.

| Field                   | Type        | Rules                              |
| ----------------------- | ----------- | ---------------------------------- |
| `id`                    | Integer     | Primary key                        |
| `crop_id`               | Integer     | Required foreign key to `crops.id` |
| `season`                | String(100) | Required                           |
| `planting_date`         | Date        | Required                           |
| `expected_harvest_date` | Date        | Required                           |
| `acreage`               | Float       | Required; greater than zero        |
| `status`                | String(30)  | Required; defaults to `planned`    |
| `notes`                 | Text        | Optional                           |
| `farm_id`               | Integer     | Required foreign key to `farms.id` |
| `created_at`            | DateTime    | Set by backend                     |

Relationship: one PlantingPlan belongs to one Farm and one Crop.

User ownership is enforced through PlantingPlan → Farm → User.

### Relationship summary

```text
User
 └── many Farms
       └── many PlantingPlans
              └── one Crop
                     └── many CropCalendars
                            └── one Source

Crop
 ├── many PlantingPlans
 └── many CropCalendars

Source
 └── many CropCalendars
```

### Database migration requirements

- The team lead coordinates shared model changes and migrations.
- The existing `PlantingPlan.crop_name` field must be migrated to `crop_id`.
- Existing planting-plan data must be preserved during the migration.
- Existing crop names must be mapped to the corresponding Crop records before the old field is removed.
- Do not discard existing records during schema changes.
- All contributors must use the agreed shared model definitions.
- Database migrations must be committed and reviewed.
- Contributors must not independently generate or apply conflicting migrations.

---

## 3. API conventions

- Base URL during local development: `http://127.0.0.1:5000`
- All API routes begin with `/api`.
- Request and response bodies use JSON.
- Dates use ISO format: `YYYY-MM-DD` when representing exact dates.
- IDs are integers.
- The backend must validate incoming data; frontend validation is supplementary.
- Do not return password hashes, session secrets, or other credentials.
- All endpoints except signup, login, and the root health endpoint require an authenticated session.
- Logout requires an authenticated session.
- Crop, CropCalendar, and Source reference endpoints require authentication unless the team lead explicitly agrees otherwise.

---

## 4. Standard response formats

### Success with a resource

HTTP `200 OK` or `201 Created`.

```json
{
  "message": "Farm created successfully",
  "data": {
    "id": 1,
    "name": "Green Valley Farm",
    "location": "Nakuru",
    "county": "Nakuru",
    "agroecological_zone": "Highland"
  }
}
```

### Success with a collection

```json
{
  "data": [
    {
      "id": 1,
      "name": "Green Valley Farm",
      "location": "Nakuru",
      "county": "Nakuru",
      "agroecological_zone": "Highland"
    }
  ]
}
```

### Error

Use a consistent error envelope:

```json
{
  "error": "A clear explanation of the problem"
}
```

### Field validation errors

```json
{
  "error": "Validation failed",
  "details": {
    "email": "Enter a valid email address"
  }
}
```

### HTTP status conventions

| Status | Meaning                                                             |
| ------ | ------------------------------------------------------------------- |
| `200`  | Successful read, update, login, logout, or delete with JSON message |
| `201`  | Resource successfully created                                       |
| `400`  | Invalid or missing request data                                     |
| `401`  | No valid authenticated session                                      |
| `404`  | Resource does not exist or is not owned by the current user         |
| `409`  | Duplicate username or email                                         |
| `500`  | Unexpected server error; do not expose stack traces                 |

For delete operations, return `200` with a message so the frontend receives a consistent JSON response.

---

## 5. Authentication contract

Authentication is session-based, not JWT-based.

| Method | Endpoint             | Purpose                                 |
| ------ | -------------------- | --------------------------------------- |
| `POST` | `/api/signup`        | Create a user account                   |
| `POST` | `/api/login`         | Verify credentials and create a session |
| `POST` | `/api/logout`        | Clear the current session               |
| `GET`  | `/api/check_session` | Return the current user's session state |

### Signup request

```json
{
  "username": "sampleuser",
  "email": "user@example.com",
  "password": "user-supplied-password"
}
```

Expected behavior:

- Require username, email, and password.
- Validate email format and reasonable field lengths.
- Reject duplicate username or email with `409`.
- Hash the password using the shared Bcrypt extension.
- Never store or return the plaintext password.
- Do not return `password_hash`.

### Login request

```json
{
  "email": "user@example.com",
  "password": "user-supplied-password"
}
```

Expected behavior:

- Verify the password against the stored hash.
- On success, establish a Flask session and return the public user fields.
- On invalid credentials, return `401` with a generic message.
- Do not reveal whether the email or password was incorrect.

### Session response

Authenticated:

```json
{
  "authenticated": true,
  "data": {
    "id": 1,
    "username": "sampleuser",
    "email": "user@example.com"
  }
}
```

Unauthenticated:

```json
{
  "authenticated": false
}
```

Return HTTP `401` for an unauthenticated check if the team implements that convention consistently. The frontend should treat it as a normal signed-out state, not an application crash.

### Cookie and CORS requirements

- Flask must use a non-empty secret key loaded from environment configuration.
- Configure CORS for the exact frontend origin, currently `http://localhost:5173`, with credentials enabled.
- Do not use wildcard `*` origins with credentialed requests.
- Frontend fetch calls must use `credentials: "include"` or equivalent Axios `withCredentials: true`.
- For local HTTP development, cookie settings must support the local frontend/backend setup.
- Production cookie security settings must be reviewed before deployment.

---

## 6. Farm API contract

All farm endpoints require an authenticated session.

| Method   | Endpoint               | Purpose                              |
| -------- | ---------------------- | ------------------------------------ |
| `GET`    | `/api/farms`           | List farms owned by the current user |
| `POST`   | `/api/farms`           | Create a farm for the current user   |
| `GET`    | `/api/farms/<farm_id>` | Get one owned farm                   |
| `PATCH`  | `/api/farms/<farm_id>` | Update an owned farm                 |
| `DELETE` | `/api/farms/<farm_id>` | Delete an owned farm                 |

### Create farm request

```json
{
  "name": "Green Valley Farm",
  "location": "Nakuru",
  "county": "Nakuru",
  "agroecological_zone": "Highland"
}
```

`name`, `location`, and `county` are required. `agroecological_zone` is optional.

The backend sets `user_id` from the authenticated session. Clients must not choose or override the owner.

### Ownership rules

- Query farms using the current user's ID from the session.
- Never trust a `user_id` supplied by the frontend.
- For get, update, and delete, retrieve the farm only if both its ID and the current user's ID match.
- Return `404` for a farm that does not exist or belongs to another user.
- Deleting a farm cascades to its planting plans under the current model relationship. Confirm this behavior in tests before relying on it.

---

## 7. Planting-plan API contract

All planting-plan endpoints require an authenticated session.

| Method   | Endpoint                              | Purpose                                                                     |
| -------- | ------------------------------------- | --------------------------------------------------------------------------- |
| `GET`    | `/api/planting-plans`                 | List the current user's plans; supports pagination and optional farm filter |
| `POST`   | `/api/farms/<farm_id>/planting-plans` | Create a plan under an owned farm                                           |
| `GET`    | `/api/planting-plans/<plan_id>`       | Get one plan belonging to the current user                                  |
| `PATCH`  | `/api/planting-plans/<plan_id>`       | Update one plan belonging to the current user                               |
| `DELETE` | `/api/planting-plans/<plan_id>`       | Delete one plan belonging to the current user                               |

### Create planting-plan request

```json
{
  "crop_id": 1,
  "season": "Long rains",
  "planting_date": "2027-03-01",
  "expected_harvest_date": "2027-07-15",
  "acreage": 2.5,
  "status": "planned",
  "notes": "Prepare the field before planting."
}
```

### Validation

- Required: `crop_id`, `season`, `planting_date`, `expected_harvest_date`, and `acreage`.
- `crop_id` must reference an existing Crop.
- Dates must be valid ISO `YYYY-MM-DD` dates.
- `acreage` must be numeric and greater than zero.
- `expected_harvest_date` must not be earlier than `planting_date`.
- `status` defaults to `planned`.
- Suggested initial status values: `planned`, `in_progress`, `harvested`, and `cancelled`. Agree on allowed values before enforcing a fixed list.
- `notes` is optional.
- The backend obtains `farm_id` from the URL and verifies that the farm belongs to the current user.

### Pagination

Example:

```text
GET /api/planting-plans?page=1&per_page=10
GET /api/planting-plans?farm_id=2&page=1&per_page=10
```

Rules:

- Default `page=1`.
- Default `per_page=10`.
- Minimum page is `1`.
- Cap `per_page` at `50`.
- If `farm_id` is provided, verify that the farm belongs to the current user before filtering.
- Return an empty `data` array when there are no matching records.

Response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 0,
    "pages": 0
  }
}
```

### Ownership rules

- A plan can only be read, updated, or deleted if its associated farm belongs to the current user.
- When creating a plan, verify ownership of the farm in the URL.
- Never trust a `user_id` or arbitrary `farm_id` from the JSON body.
- Return `404` for plans or farms outside the user's ownership.

---

## 8. Crop reference API contract

These endpoints provide read-only crop information.

All endpoints require an authenticated session.

| Method | Endpoint               | Purpose                  |
| ------ | ---------------------- | ------------------------ |
| `GET`  | `/api/crops`           | List available crops     |
| `GET`  | `/api/crops/<crop_id>` | Retrieve a specific crop |

### Crop collection

`GET /api/crops`

The endpoint returns the available crop records.

Optional pagination may be implemented if agreed, but if pagination is introduced, it must follow the shared pagination conventions.

### Crop detail

`GET /api/crops/<crop_id>`

Returns a crop and its available descriptive information.

The API must not expose internal database credentials, or unrelated sensitive data.

---

## 9. Crop-calendar and source API contract

These endpoints provide sourced agricultural reference information.

All endpoints require an authenticated session.

| Method | Endpoint                            | Purpose                                        |
| ------ | ----------------------------------- | ---------------------------------------------- |
| `GET`  | `/api/crop-calendars`               | List crop-calendar entries; supports filtering |
| `GET`  | `/api/crop-calendars/<calendar_id>` | Retrieve a specific crop-calendar entry        |
| `GET`  | `/api/sources/<source_id>`          | Retrieve source attribution details            |

### Crop-calendar filtering

Example:

```text
GET /api/crop-calendars?crop_id=1
GET /api/crop-calendars?county=Nakuru
GET /api/crop-calendars?season=Long%20rains
GET /api/crop-calendars?agroecological_zone=Highland
GET /api/crop-calendars?crop_id=1&county=Nakuru
```

Supported optional filters:

- `crop_id`
- `county`
- `sub_county`
- `season`
- `agroecological_zone`

Filters should be combined where provided.

Return an empty `data` array when no matching calendar entries exist.

### Crop-calendar response expectations

A crop-calendar response should include the available:

- Calendar entry ID
- Crop ID and crop name where practical
- County or geographic coverage
- Sub-county, if available
- Agroecological zone, if available
- Season, if available
- Production system, if available
- Planting window
- Harvest window
- Verification status
- Source ID
- Source title and organisation where practical
- Source reference or page information
- Notes, if available

### Source detail

`GET /api/sources/<source_id>`

Returns available source metadata, including organisation, title, URL, licence, dates, and notes.

### Data integrity and source attribution

- Do not invent planting or harvest dates.
- Do not falsely claim county-level accuracy when the source only provides national or regional information.
- Preserve source attribution.
- Clearly distinguish verified from unverified information.
- Source data should be reviewable and traceable.
- If information is not available, represent it as unavailable rather than fabricating values.

---

## 10. Suggested backend file ownership

| Feature                              | Suggested files                                                                         |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Authentication                       | `backend/app/routes/auth.py`                                                            |
| Farm CRUD                            | `backend/app/routes/farms.py`                                                           |
| Planting-plan CRUD                   | `backend/app/routes/planting_plans.py`                                                  |
| Crop reference routes                | `backend/app/routes/crops.py`                                                           |
| Crop-calendar and source routes      | `backend/app/routes/crop_calendars.py` or agreed modular structure                      |
| Shared models                        | `backend/app/models/` — team lead coordinates changes                                   |
| Shared extensions/config/app factory | `backend/app/extensions.py`, `config.py`, `__init__.py` — team lead coordinates changes |
| Seed data                            | `backend/seed.py` or agreed project location — team lead coordinates changes            |
| Tests                                | `backend/tests/`                                                                        |

Use Flask Blueprints for feature routes.

The team lead coordinates blueprint registration in the application factory to avoid conflicting edits.

---

## 11. Testing acceptance criteria

Every feature must include tests for its agreed responsibilities.

### Authentication

- Successful signup and login.
- Duplicate email/username rejection.
- Incorrect password rejection.
- Session persists across requests in a test client.
- Logout clears the session.
- Protected routes reject unauthenticated requests.

### Farms

- Create, list, retrieve, update, and delete a farm.
- Required-field validation.
- User A cannot retrieve, update, or delete User B's farm.
- Farm list contains only the current user's farms.

### Planting plans

- Create, list, retrieve, update, and delete a plan.
- Invalid dates and non-positive acreage are rejected.
- Pagination returns the correct page and metadata.
- Optional farm filter works.
- A user cannot create a plan under another user's farm.
- A user cannot retrieve, update, or delete another user's plan.
- Invalid or nonexistent crop IDs are rejected.

### Crop reference endpoints

- Crop collection returns the available crops.
- Crop detail endpoint returns the correct crop.
- Invalid or nonexistent crop IDs return `404`.
- Protected endpoints reject unauthenticated requests.

### Crop-calendar and source endpoints

- Crop-calendar collection returns available records.
- Crop-calendar filtering works for supported filters.
- Multiple filters can be combined.
- Crop-calendar detail returns the correct entry.
- Source detail returns the correct source.
- Invalid or nonexistent calendar/source IDs return `404`.
- Source attribution is included where expected.
- Protected endpoints reject unauthenticated requests.

### Seed data

- Seed script creates sample data for all required models.
- Seed script creates relationships correctly.
- Seed script can be run repeatedly without unintentionally duplicating data.
- Seed data uses defensible, appropriately attributed reference information.
- Seed data does not falsely represent unverified agricultural guidance as verified.

---

## 12. Git collaboration rules

- Each contributor works on a feature branch created from the latest agreed `main` branch.
- Contributors must sync with `main` before creating their feature branches.
- Suggested branch names:
  - `feature/crop-reference-models` — team lead
  - `feature/auth-api` — authentication
  - `feature/farm-and-reference-api` — farms and read-only reference endpoints
  - `feature/planting-plan-api` — planting plans
- Do not commit `.env`, virtual environments, database passwords, or secret keys.
- Do not independently change shared models, migrations, extensions, configuration, or app-factory registration.
- Discuss shared changes with the team lead first.
- Open a pull request with a summary, test evidence, and migration requirements.
- The team lead reviews and integrates changes.
- Keep commits focused and descriptive.
- Contributors must not push directly to `main` unless explicitly agreed.

### Branch setup

Each contributor should execute:

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/<assigned-task>
```

---

## 13. Change control

This contract is the agreed initial implementation target.

If implementation reveals a necessary change:

1. Explain the reason and affected endpoints, models, or relationships.
2. Discuss it with the team lead.
3. Agree on the change before coding against a different contract.
4. Update this document.
5. Notify all contributors.

---

## 14. Phase 2 boundaries

The implementation focuses on:

- User authentication and sessions.
- Farm management.
- Planting-plan management.
- Crop reference information.
- Crop-calendar information.
- Source attribution and traceability.
- Existing external weather integration.
- React integration with the Flask backend.
- Tests, seed data, documentation, and integration.

Do not independently introduce new features such as machine learning predictions, growing-degree-day calculations, irrigation automation, sensor systems, alerts, or additional persistence for external weather data without team agreement and assignment-scope justification.

---

**End of contract**
