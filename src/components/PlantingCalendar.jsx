import { useState } from "react";
import { plantingCalendarData, regionalCalendarContext } from "../data/plantingCalendarData";

function PlantingCalendar({ entries = plantingCalendarData, regionalContext = regionalCalendarContext }) {
  const [selectedCropId, setSelectedCropId] = useState("all");
  const visibleEntries = selectedCropId === "all"
    ? entries
    : entries.filter((entry) => entry.id === selectedCropId);

  return (
    <section aria-labelledby="planting-calendar-title">
      <h2 id="planting-calendar-title">Planting calendar</h2>
      <label htmlFor="calendar-crop">Filter by crop</label>{" "}
      <select
        id="calendar-crop"
        value={selectedCropId}
        onChange={(event) => setSelectedCropId(event.target.value)}
      >
        <option value="all">All crops</option>
        {entries.map((entry) => (
          <option value={entry.id} key={entry.id}>{entry.crop}</option>
        ))}
      </select>
      <p>Planning reference only. Actual dates depend on local rainfall, location, and farming conditions.</p>

      <div className="calendar-list">
        {visibleEntries.map((entry) => (
          <article key={entry.id}>
            <h3>{entry.crop}</h3>
            <dl>
              <dt>County</dt><dd>{entry.county ?? "Unavailable"}</dd>
              <dt>Agro-ecological zone</dt><dd>{entry.agroEcologicalZone ?? "Unavailable"}</dd>
              <dt>Season</dt><dd>{entry.season ?? "Unavailable"}</dd>
              <dt>Planting</dt><dd>{entry.plantingStart} – {entry.plantingEnd}</dd>
              <dt>Indicative harvest</dt><dd>{entry.harvestStart} – {entry.harvestEnd}</dd>
              <dt>Production system</dt><dd>{entry.productionSystem ?? "Unavailable"}</dd>
            </dl>
            <p><strong>Verification:</strong> {entry.verificationStatus}</p>
            <ul>
              {entry.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>
                  {source.sourceDate && <span> ({source.sourceDate})</span>}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <aside aria-labelledby="regional-context-title">
        <h3 id="regional-context-title">Regional context from FAO</h3>
        <p>These are broad seasonal observations, not crop-specific planting dates.</p>
        {regionalContext.map((item) => (
          <article key={item.id}>
            <h4>{item.region}</h4>
            {item.countiesMentioned.length > 0 && <p>Counties named: {item.countiesMentioned.join(", ")}</p>}
            <p>{item.season}</p>
            <p>{item.plantingPeriod}</p>
            <p>{item.harvestPeriod}</p>
            <p><strong>Verification:</strong> {item.verificationStatus}</p>
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.source}</a>
            {item.sourceDate && <span> ({item.sourceDate})</span>}
          </article>
        ))}
      </aside>
    </section>
  );
}

export default PlantingCalendar;
