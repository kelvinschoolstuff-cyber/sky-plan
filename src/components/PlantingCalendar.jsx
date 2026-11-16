import { useState } from 'react';
import { plantingCalendarData } from '../data/plantingCalendarData';
import './plantingCalendar.css';

const unavailable = 'Unavailable';

function getStatusClass(status) {
  if (status.includes('Unavailable')) return 'status-unavailable';
  if (status.includes('Not cross-checked')) return 'status-unverified';
  return 'status-verified';
}

function formatPeriod(start, end) {
  if (!start && !end) return unavailable;
  return `${start || unavailable} – ${end || unavailable}`;
}

function PlantingCalendar() {
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');

  const crops = ['All', ...new Set(plantingCalendarData.map((item) => item.crop))];
  const seasons = [
    'All',
    ...new Set(plantingCalendarData.map((item) => item.season || unavailable)),
  ];

  const filteredData = plantingCalendarData.filter((item) => {
    const matchesCrop = selectedCrop === 'All' || item.crop === selectedCrop;
    const itemSeason = item.season || unavailable;
    const matchesSeason = selectedSeason === 'All' || itemSeason === selectedSeason;
    return matchesCrop && matchesSeason;
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
                <p><strong>Season:</strong> {item.season || unavailable}</p>
                <p>
                  <strong>Production system:</strong>{' '}
                  {item.productionSystem || 'Not specified by source'}
                </p>
              </div>

              <div className="card-dates">
                <p><strong>Planting:</strong> {formatPeriod(item.plantingStart, item.plantingEnd)}</p>
                <p><strong>Harvest:</strong> {formatPeriod(item.harvestStart, item.harvestEnd)}</p>
              </div>

              <footer className="card-source">
                <p><strong>Source:</strong> {item.source}</p>
                {item.sourceUrl && (
                  <p>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                      View source data
                    </a>
                  </p>
                )}
                <p><strong>Source date:</strong> {item.sourceDate || unavailable}</p>
                <p>
                  <strong>Cross-check status:</strong>{' '}
                  <span className={getStatusClass(item.verificationStatus)}>
                    {item.verificationStatus}
                  </span>
                </p>
                {item.notes && <p className="source-notes">{item.notes}</p>}
              </footer>
            </article>
          ))
        ) : (
          <p className="no-results">No calendar data matches your selected filters.</p>
        )}
      </section>
    </div>
  );
}

export default PlantingCalendar;
