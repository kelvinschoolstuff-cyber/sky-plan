
import React, { useState } from 'react';
import { plantingCalendarData } from '../data/plantingCalendarData';
import './PlantingCalendar.css'; 

function PlantingCalendar() {
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');

  
  const crops = ['All', ...new Set(plantingCalendarData.map(item => item.crop))];
  const seasons = ['All', ...new Set(plantingCalendarData.map(item => item.season))];

  
  const filteredData = plantingCalendarData.filter(item => {
    const matchesCrop = selectedCrop === 'All' || item.crop === selectedCrop;
    const matchesSeason = selectedSeason === 'All' || item.season === selectedSeason;
    return matchesCrop && matchesSeason;
  });

  // Helper function to determine status color class
  const getStatusClass = (status) => {
    if (status.includes('Unavailable')) return 'status-unavailable';
    if (status.includes('Unverified')) return 'status-unverified';
    return 'status-verified';
  };

  return (
    <div className="planting-calendar-container">
      <header className="calendar-header">
        <h2>Planting & Harvesting Calendar</h2>
        <p className="calendar-disclaimer">
          <strong>Planning Reference Only.</strong> These dates are indicative. Always consult your local agricultural extension officer before planting.
        </p>
      </header>

      <section className="calendar-filters" aria-label="Filter calendar data">
        <div className="filter-group">
          <label htmlFor="crop-filter">Crop:</label>
          <select 
            id="crop-filter" 
            value={selectedCrop} 
            onChange={(e) => setSelectedCrop(e.target.value)}
          >
            {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="season-filter">Season:</label>
          <select 
            id="season-filter" 
            value={selectedSeason} 
            onChange={(e) => setSelectedSeason(e.target.value)}
          >
            {seasons.map(season => <option key={season} value={season}>{season}</option>)}
          </select>
        </div>
      </section>

      <section className="calendar-grid">
        {filteredData.length > 0 ? (
          filteredData.map(item => (
            <article key={item.id} className="calendar-card">
              <h3 className="card-title">{item.crop}</h3>
              
              <div className="card-details">
                <p><strong>Location:</strong> {item.county || item.agroEcologicalZone}</p>
                <p><strong>Season:</strong> {item.season} ({item.productionSystem})</p>
              </div>

              <div className="card-dates">
                {item.plantingStart ? (
                  <>
                    <p><strong>Plant:</strong> {item.plantingStart} – {item.plantingEnd}</p>
                    <p><strong>Harvest:</strong> {item.harvestStart} – {item.harvestEnd}</p>
                  </>
                ) : (
                  <p className="date-unavailable">
                    Data currently unavailable for this specific combination.
                  </p>
                )}
              </div>

              <footer className="card-source">
                <p><strong>Source:</strong> {item.source}</p>
                {item.sourceUrl && (
                  <p>
                    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                      View Source Document
                    </a>
                  </p>
                )}
                <p>
                  <strong>Status:</strong>{' '}
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