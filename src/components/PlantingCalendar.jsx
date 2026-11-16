import { useState } from 'react';
import {
  calendarReferenceSources,
  plantingCalendarData,
} from '../data/plantingCalendarData';
import './plantingCalendar.css';

const unavailable = 'Unavailable';

function getStatusClass(status) {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes('unavailable')) return 'status-unavailable';
  if (
    normalizedStatus.includes('not cross-checked') ||
    normalizedStatus.includes('mismatch') ||
    normalizedStatus.includes('unverified')
  ) {
    return 'status-unverified';
  }
  return 'status-verified';
}

function formatPeriod(start, end) {
  if (!start && !end) return unavailable;
  return `${start || unavailable} – ${end || unavailable}`;
}

function PlantingCalendar() {
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');

  const crops = ['All', ...new Set(plantingCalendarData.map((item) => item.crop))];
  const locations = [
    'All',
    ...new Set(
      plantingCalendarData.flatMap((item) =>
        [item.county, item.agroEcologicalZone].filter(Boolean),
      ),
    ),
    ...(plantingCalendarData.some(
      (item) => !item.county && !item.agroEcologicalZone,
    )
      ? [unavailable]
      : []),
  ];
  const seasons = [
    'All',
    ...new Set(plantingCalendarData.map((item) => item.season || unavailable)),
  ];

  const filteredData = plantingCalendarData.filter((item) => {
    const matchesCrop = selectedCrop === 'All' || item.crop === selectedCrop;
    const itemSeason = item.season || unavailable;
    const matchesSeason = selectedSeason === 'All' || itemSeason === selectedSeason;
    const matchesLocation =
      selectedLocation === 'All' ||
      item.county === selectedLocation ||
      item.agroEcologicalZone === selectedLocation ||
      (selectedLocation === unavailable &&
        !item.county &&
        !item.agroEcologicalZone);
    return matchesCrop && matchesSeason && matchesLocation;
  });

  return (
    <div className="planting-calendar-container">
      <header className="calendar-header">
        <h2>Planting &amp; Harvesting Calendar</h2>
        <p className="calendar-disclaimer">
          <strong>Planning reference only.</strong> These indicative periods are not
          guaranteed dates. Check current local conditions and advice from your
          agricultural extension officer before planting.
        </p>
      </header>

      <section className="calendar-filters" aria-label="Filter calendar data">
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
          <label htmlFor="location-filter">County or agro-ecological zone:</label>
          <select
            id="location-filter"
            value={selectedLocation}
            onChange={(event) => setSelectedLocation(event.target.value)}
          >
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
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

      <section className="calendar-grid" aria-label="Planting calendar entries">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <article key={item.id} className="calendar-card">
              <h3 className="card-title">{item.crop}</h3>

              <div className="card-details">
                {item.county && <p><strong>County:</strong> {item.county}</p>}
                <p>
                  <strong>Agro-ecological zone:</strong>{' '}
                  {item.agroEcologicalZone || 'Not specified by source'}
                </p>
                {item.subCounty && (
                  <p><strong>Sub-county:</strong> {item.subCounty}</p>
                )}
                <p><strong>Season:</strong> {item.season || unavailable}</p>
                <p>
                  <strong>Production system:</strong>{' '}
                  {item.productionSystem || 'Not specified by source'}
                </p>
                <p>
                  <strong>Growing duration:</strong>{' '}
                  {item.growingDuration || 'Not specified by source'}
                </p>
              </div>

              <div className="card-dates">
                <p><strong>Planting:</strong> {formatPeriod(item.plantingStart, item.plantingEnd)}</p>
                <p><strong>Harvest:</strong> {formatPeriod(item.harvestStart, item.harvestEnd)}</p>
              </div>

              <footer className="card-source">
                <p><strong>Source:</strong> {item.sourceName}</p>
                {item.sourceCropName && (
                  <p><strong>Source crop label:</strong> {item.sourceCropName}</p>
                )}
                {item.sourceUrl && (
                  <p>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                      Open source platform
                    </a>
                  </p>
                )}
                {item.sourceRecordUrl && (
                  <p>
                    <a
                      href={item.sourceRecordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View queried record (undocumented endpoint)
                    </a>
                  </p>
                )}
                <p><strong>Source document:</strong> {item.sourceDocument}</p>
                <p>
                  <strong>Source update date:</strong>{' '}
                  {item.sourceDate
                    ? `${item.sourceDate} (${item.sourceDateType})`
                    : unavailable}
                </p>
                <p>
                  <strong>Publication date:</strong>{' '}
                  {item.sourcePublishedDate || 'Not stated by source'}
                </p>
                <p>
                  <strong>Page or worksheet:</strong>{' '}
                  {item.sourcePageOrSheet || 'Not specified by source'}
                </p>
                <p>
                  <strong>Licence:</strong>{' '}
                  {item.licence || 'Not stated in the FAO record'}
                </p>
                <p><strong>Accessed:</strong> {item.accessedDate}</p>
                <p>
                  <strong>Review status:</strong>{' '}
                  <span className={getStatusClass(item.verificationStatus)}>
                    {item.reviewStatus}
                  </span>
                </p>
                <p>
                  <strong>Last reviewed:</strong> {item.lastReviewedAt}
                </p>
                <p className="source-notes">{item.sourceAccessNote}</p>
                {item.sourceCropLabelNote && (
                  <p className="source-notes">{item.sourceCropLabelNote}</p>
                )}
                {item.notes && <p className="source-notes">{item.notes}</p>}
              </footer>
            </article>
          ))
        ) : (
          <p className="no-results">No calendar data matches your selected filters.</p>
        )}
      </section>

      <section className="card-source" aria-label="Calendar reference sources">
        <h3>Reference sources for future cross-checking</h3>
        <p>
          These sources were identified in the project research, but their crop
          windows have not been independently checked against the entries above.
        </p>
        <ul>
          {calendarReferenceSources.map((source) => (
            <li key={source.sourceName}>
              <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">
                {source.sourceName}
              </a>
              {source.sourceDate && ` (updated ${source.sourceDate})`}
              {source.licence && `; ${source.licence}`}
              {' - '}
              {source.reviewStatus}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default PlantingCalendar;
