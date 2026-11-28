import { useEffect, useState } from "react";
import { calendarReferenceSources } from "../data/plantingCalendarData";
import "./plantingCalendar.css";
import { getCropCalendars } from "../services/CropCalendarApi";

const unavailable = "Unavailable";

function getStatusClass(status) {
  const normalizedStatus = (status || "").toLowerCase();
  if (normalizedStatus.includes("unavailable")) return "status-unavailable";
  if (
    normalizedStatus.includes("not cross-checked") ||
    normalizedStatus.includes("mismatch") ||
    normalizedStatus.includes("unverified")
  ) {
    return "status-unverified";
  }
  return "status-verified";
}

function PlantingCalendar() {
  const [calendarData, setCalendarData] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("All");
  const [selectedSeason, setSelectedSeason] = useState("All");
  const [selectedZone, setSelectedZone] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCalendarData() {
      try {
        setLoading(true);
        setError("");

        const response = await getCropCalendars();
        setCalendarData(response.data || []);
      } catch (err) {
        setError(err.message || "Failed to load planting calendar data.");
      } finally {
        setLoading(false);
      }
    }

    fetchCalendarData();
  }, []);

  const crops = [
    "All",
    ...new Set(calendarData.map((item) => item.crop_name).filter(Boolean)),
  ];

  const zones = [
    "All",
    ...new Set(
      calendarData.map((item) => item.agroecological_zone).filter(Boolean),
    ),
  ];

  const seasons = [
    "All",
    ...new Set(calendarData.map((item) => item.season).filter(Boolean)),
  ];

  const filteredData = calendarData.filter((item) => {
    const matchesCrop =
      selectedCrop === "All" || item.crop_name === selectedCrop;

    const matchesSeason =
      selectedSeason === "All" || item.season === selectedSeason;

    const matchesZone =
      selectedZone === "All" || item.agroecological_zone === selectedZone;

    return matchesCrop && matchesSeason && matchesZone;
  });

  return (
    <div className="planting-calendar-container">
      <header className="calendar-header">
        <h2>Planting &amp; Harvesting Calendar</h2>
        <p className="calendar-disclaimer">
          <strong>Planning reference only.</strong> These indicative periods are
          not guaranteed dates and do not specify a calendar year. Check current
          local conditions and advice from your agricultural extension officer
          before planting.
        </p>
      </header>

      {loading && <p role="status">Loading planting calendar...</p>}

      {!loading && error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <section
            className="calendar-filters"
            aria-label="Filter calendar data"
          >
            <div className="filter-group">
              <label htmlFor="crop-filter">Crop:</label>
              <select
                id="crop-filter"
                value={selectedCrop}
                onChange={(event) => setSelectedCrop(event.target.value)}
              >
                {crops.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="zone-filter">Agro-ecological zone:</label>
              <select
                id="zone-filter"
                value={selectedZone}
                onChange={(event) => setSelectedZone(event.target.value)}
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="season-filter">Season:</label>
              <select
                id="season-filter"
                value={selectedSeason}
                onChange={(event) => setSelectedSeason(event.target.value)}
              >
                {seasons.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section
            className="calendar-grid"
            aria-label="Planting calendar entries"
          >
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <article key={item.id} className="calendar-card">
                  <h3 className="card-title">
                    {item.crop_name || unavailable}
                  </h3>

                  <div className="card-details">
                    {item.county && (
                      <p>
                        <strong>County:</strong> {item.county}
                      </p>
                    )}

                    <p>
                      <strong>Agro-ecological-zone:</strong>{" "}
                      {item.agroecological_zone || "Not specified by source"}
                    </p>

                    {item.subcounty && (
                      <p>
                        <strong>Sub-County:</strong> {item.subcounty}
                      </p>
                    )}

                    <p>
                      <strong>Season:</strong> {item.season || unavailable}
                    </p>

                    <p>
                      <strong>Production system:</strong>{" "}
                      {item.production_system || "Not specified by source"}
                    </p>
                  </div>

                  <div className="card-dates">
                    <p>
                      <strong>Planting:</strong>{" "}
                      {item.planting_window || unavailable}
                    </p>

                    <p>
                      <strong>Harvest:</strong>{" "}
                      {item.harvest_window || unavailable}
                    </p>
                  </div>

                  <footer className="card-source">
                    <p>
                      <strong>Source:</strong>{" "}
                      {item.source?.title || unavailable}
                    </p>

                    {item.source?.organisation && (
                      <p>
                        <strong>Organisation:</strong>{" "}
                        {item.source.organisation}
                      </p>
                    )}

                    {item.source_reference && (
                      <p>
                        <strong>Source reference:</strong>{" "}
                        {item.source_reference}
                      </p>
                    )}

                    <p>
                      <strong>Review status:</strong>{" "}
                      <span
                        className={getStatusClass(item.verification_status)}
                      >
                        {item.verification_status || unavailable}
                      </span>
                    </p>

                    {item.reviewed_at && (
                      <p>
                        <strong>Last reviewed:</strong>{" "}
                        {new Date(item.reviewed_at).toLocaleDateString()}
                      </p>
                    )}

                    {item.notes && <p className="source-notes">{item.notes}</p>}
                  </footer>
                </article>
              ))
            ) : (
              <p className="no-results">
                No calendar data matches your selected filters.
              </p>
            )}
          </section>
        </>
      )}

      <section className="card-source" aria-label="Calendar reference sources">
        <h3>Reference sources for future cross-checking</h3>
        <p>
          These sources were identified in the project research, but their crop
          windows have not been independently checked against the entries above.
        </p>

        <ul>
          {calendarReferenceSources.map((source) => (
            <li key={source.sourceName}>
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.sourceName}
              </a>
              {source.sourceDate && ` (updated ${source.sourceDate})`}
              {source.licence && `; ${source.licence}`}
              {" - "}
              {source.reviewStatus}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default PlantingCalendar;
