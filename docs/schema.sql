-- AgriCast database schema (PostgreSQL), generated from backend/app/db.py.
-- Import into drawSQL to draw the diagram, or run it in psql.
-- Notes:
--  * Crops are reference data in backend/app/crops.py, not a table, so plantings.crop and crop_calendars.crop hold a text crop key (no foreign key).
--  * planting_start/planting_end/harvest_start/harvest_end are 'MM-DD' text: windows repeat every year and may wrap over New Year.
--  * crop_calendars.administrative_areas keeps the source's own area text (the KALRO/FAO file lists old provinces and districts per agro-ecological zone).
--  * Weather responses are cached in memory, not stored. Alerts are computed from plantings, reminders and the forecast.

CREATE TABLE users (
	id SERIAL NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	password_hash VARCHAR(100) NOT NULL, 
	phone VARCHAR(20), 
	sms_alerts BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);
CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE TABLE farms (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	latitude FLOAT NOT NULL, 
	longitude FLOAT NOT NULL, 
	area_ha FLOAT, 
	county VARCHAR(60), 
	sub_county VARCHAR(80), 
	agro_ecological_zone VARCHAR(80), 
	production_system VARCHAR(20) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX ix_farms_user_id ON farms (user_id);

CREATE TABLE plantings (
	id SERIAL NOT NULL, 
	farm_id INTEGER NOT NULL, 
	crop VARCHAR(40) NOT NULL, 
	planting_date DATE NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id) ON DELETE CASCADE
);
CREATE INDEX ix_plantings_farm_id ON plantings (farm_id);

CREATE TABLE observations (
	id SERIAL NOT NULL, 
	planting_id INTEGER NOT NULL, 
	observed_on DATE NOT NULL, 
	growth_stage VARCHAR(60), 
	rainfall_mm FLOAT, 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(planting_id) REFERENCES plantings (id) ON DELETE CASCADE
);
CREATE INDEX ix_observations_planting_id ON observations (planting_id);

CREATE TABLE reminders (
	id SERIAL NOT NULL, 
	planting_id INTEGER NOT NULL, 
	due_date DATE NOT NULL, 
	text VARCHAR(200) NOT NULL, 
	done BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(planting_id) REFERENCES plantings (id) ON DELETE CASCADE
);
CREATE INDEX ix_reminders_planting_id ON reminders (planting_id);

CREATE TABLE sources (
	id SERIAL NOT NULL, 
	organisation VARCHAR(200) NOT NULL, 
	title VARCHAR(300) NOT NULL, 
	url VARCHAR(500), 
	source_document VARCHAR(300), 
	licence VARCHAR(100), 
	published_date DATE, 
	accessed_date DATE, 
	PRIMARY KEY (id)
);

CREATE TABLE crop_calendars (
	id SERIAL NOT NULL, 
	crop VARCHAR(40) NOT NULL, 
	county VARCHAR(60), 
	sub_county VARCHAR(80), 
	agro_ecological_zone VARCHAR(80), 
	administrative_areas TEXT, 
	season VARCHAR(60), 
	production_system VARCHAR(20) NOT NULL, 
	planting_start VARCHAR(5) NOT NULL, 
	planting_end VARCHAR(5) NOT NULL, 
	harvest_start VARCHAR(5), 
	harvest_end VARCHAR(5), 
	source_id INTEGER NOT NULL, 
	source_page_or_sheet VARCHAR(100), 
	source_wording TEXT, 
	reviewer_role VARCHAR(100), 
	review_status VARCHAR(20) NOT NULL, 
	last_reviewed_at DATE, 
	version INTEGER NOT NULL, 
	notes TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);
CREATE INDEX ix_crop_calendars_county ON crop_calendars (county);
CREATE INDEX ix_crop_calendars_crop ON crop_calendars (crop);
