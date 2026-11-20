import { useState } from 'react';
import { plantingCalendarData } from '../data/PlantingCalendar';
import './PlantingCalendar.css';

const unavailable = 'N/A';

function PlantingCalendar() {
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');

  const crops = ['All', ...new Set(plantingCalendarData.map((item) => item.crop))];
  const zones = ['All', ...new Set(plantingCalendarData.map((item) => item.agroEcologicalZone).filter(Boolean))];
  const seasons = ['All', ...new Set(plantingCalendarData.map((item) => item.season).filter(Boolean))];

  const filtered = plantingCalendarData.filter((item) => {
    const cropOk = selectedCrop === 'All' || item.crop === selectedCrop;
    const seasonOk = selectedSeason === 'All' || item.season === selectedSeason;
    const zoneOk = selectedZone === 'All' || item.agroEcologicalZone === selectedZone;
    return cropOk && seasonOk && zoneOk;
  });

  const statusClass = (status) => {
    if (status === 'Unavailable') return 'badge-red';
    if (status === 'Not cross-checked') return 'badge-orange';
    return 'badge-green';
  };

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <h2>Planting & harvesting calendar</h2>
        <p className="calendar-note">
          Dates are from FAO and are indicative only. Check with your local extension officer before planting.
        </p>
      </header>

      <div className="filters">
        <div className="filter">
          <label>Crop</label>
          <select value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
            {crops.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter">
          <label>Zone or county</label>
          <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="filter">
          <label>Season</label>
          <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
            {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="cards">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div key={item.id} className="card">
              <div className="card-head">
                <h3>{item.crop}</h3>
                <span className={`badge ${statusClass(item.verificationStatus)}`}>{item.verificationStatus}</span>
              </div>

              <div className="card-body">
                <p><strong>Zone:</strong> {item.agroEcologicalZone || unavailable}</p>
                <p><strong>Season:</strong> {item.season || unavailable}</p>
                <p><strong>System:</strong> {item.productionSystem || 'Not specified'}</p>
              </div>

              <div className="dates">
                <div className="date-col">
                  <span>Plant</span>
                  <strong>{item.plantingStart || unavailable} to {item.plantingEnd || unavailable}</strong>
                </div>
                <div className="date-col">
                  <span>Harvest</span>
                  <strong>{item.harvestStart || unavailable} to {item.harvestEnd || unavailable}</strong>
                </div>
              </div>

              <details className="source">
                <summary>View source details</summary>
                <p><strong>Source:</strong> {item.source}</p>
                <p><strong>Published:</strong> {item.sourceDate || 'Unknown'}</p>
                {item.notes && <p className="note">{item.notes}</p>}
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">Open FAO record</a>
              </details>
            </div>
          ))
        ) : (
          <p className="empty">No records match your filters.</p>
        )}
      </div>
    </div>
  );
}

export default PlantingCalendar;