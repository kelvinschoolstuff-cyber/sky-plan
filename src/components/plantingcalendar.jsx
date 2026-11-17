import { useState } from 'react';
import { plantingCalendarData } from '../data/plantingCalendarData';
import './PlantingCalendar.css';

const unavailable = 'N/A';

function PlantingCalendar() {
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');

  
  const crops = ['All', ...new Set(plantingCalendarData.map((item) => item.crop))];
  const zones = ['All', ...new Set(plantingCalendarData.map((item) => item.zone))];
  const seasons = ['All', ...new Set(plantingCalendarData.map((item) => item.season))];

  
  const filteredData = plantingCalendarData.filter((item) => {
    const matchCrop = selectedCrop === 'All' || item.crop === selectedCrop;
    const matchSeason = selectedSeason === 'All' || item.season === selectedSeason;
    const matchZone = selectedZone === 'All' || item.zone === selectedZone;
    return matchCrop && matchSeason && matchZone;
  });

  
  const getStatusColor = (status) => {
    if (status.includes('Unavailable')) return 'bg-red';
    if (status.includes('Not cross-checked')) return 'bg-orange';
    return 'bg-green';
  };

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <h2>Planting & Harvesting Calendar</h2>
        <div className="warning-banner">
          <strong>Note:</strong> These are indicative periods from the FAO. Always check with your local agricultural extension officer before planting.
        </div>
      </header>

      {/* Filters */}
      <div className="filters-row">
        <div className="filter-box">
          <label>Crop</label>
          <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
            {crops.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-box">
          <label>Zone / County</label>
          <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="filter-box">
          <label>Season</label>
          <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
            {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Data Grid */}
      <div className="cards-grid">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div key={item.id} className="crop-card">
              
              <div className="card-top">
                <h3>{item.crop}</h3>
                <span className={`status-badge ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="card-info">
                <p><strong>Zone:</strong> {item.zone}</p>
                <p><strong>Season:</strong> {item.season}</p>
                <p><strong>Duration:</strong> {item.duration || unavailable}</p>
              </div>

              <div className="card-dates">
                <div className="date-box">
                  <span>Plant</span>
                  <strong>{item.plantStart || unavailable} to {item.plantEnd || unavailable}</strong>
                </div>
                <div className="date-box">
                  <span>Harvest</span>
                  <strong>{item.harvestStart || unavailable} to {item.harvestEnd || unavailable}</strong>
                </div>
              </div>

              {/* Clean source link - no massive text dump */}
              <div className="card-footer">
                <details>
                  <summary>View source details</summary>
                  <div className="source-content">
                    <p><strong>Source:</strong> {item.sourceName}</p>
                    <p><strong>Published:</strong> {item.sourceDate || 'Unknown'}</p>
                    {item.notes && <p className="note-text">{item.notes}</p>}
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                      Open FAO Record
                    </a>
                  </div>
                </details>
              </div>

            </div>
          ))
        ) : (
          <p className="empty-state">No records match your filters.</p>
        )}
      </div>
    </div>
  );
}

export default PlantingCalendar;