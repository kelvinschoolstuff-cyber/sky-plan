import { guidanceData, guidanceThresholds } from "../data/guidanceData";
import "./weatherForecast.css";

function getApplicableGuidance(weather) {
  const daily = weather?.daily;
  const rainfall = daily?.precipitation_sum ?? [];
  const temperatures = daily?.temperature_2m_max ?? [];
  const hasRainfallData = rainfall.length > 0 && rainfall.every(Number.isFinite);
  const applicableIds = new Set();

  if (hasRainfallData) {
    if (rainfall.some((amount) => amount >= guidanceThresholds.heavyDailyRainfallMm)) {
      applicableIds.add("heavy-rainfall");
    } else if (rainfall.some((amount) => amount >= guidanceThresholds.dryDailyRainfallMm)) {
      applicableIds.add("expected-rainfall");
    } else {
      applicableIds.add("dry-conditions");
    }
  }

  if (temperatures.some((temperature) => temperature >= guidanceThresholds.highTemperatureC)) {
    applicableIds.add("high-temperature");
  }

  return guidanceData.filter((item) => applicableIds.has(item.id));
}

function Guidance({ weather }) {
  const items = getApplicableGuidance(weather);

  return (
    <section className="forecast-section guidance-section" aria-labelledby="guidance-title">
      <h2 id="guidance-title">Farming guidance</h2>
      <p className="guidance-disclaimer">
        General information only; it does not replace local expert advice or official alerts.
      </p>
      <p className="guidance-threshold-note">
        App indicators only: heavy rain means 20 mm or more forecast in a day; high temperature means 30°C or above.
        These are not official KMD warning thresholds.
      </p>
      {items.length ? (
        <ul className="guidance-list">
          {items.map((item) => (
            <li key={item.id} className="guidance-item">
              <h3>{item.title}</h3>
              <p>{item.advice}</p>
              <p className="guidance-source">
                Source: <a href={item.source.url} target="_blank" rel="noreferrer">{item.source.name}</a>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="forecast-empty">Guidance is not available because forecast data is incomplete.</p>
      )}
    </section>
  );
}

export default Guidance;