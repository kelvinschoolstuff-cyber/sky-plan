import { guidanceData, guidanceDisclaimer } from "../data/guidanceData";

function getForecastSummary(weather) {
  const daily = weather?.daily;
  if (!daily?.time?.length) return null;

  const rainTotal = daily.precipitation_sum?.reduce(
    (sum, amount) => sum + (Number(amount) || 0),
    0,
  );
  const high = daily.temperature_2m_max?.reduce(
    (maximum, temperature) => Number.isFinite(Number(temperature))
      ? Math.max(maximum, Number(temperature))
      : maximum,
    -Infinity,
  );

  return { rainTotal, high };
}

function Guidance({ weather }) {
  const summary = getForecastSummary(weather);

  return (
    <section aria-labelledby="guidance-title">
      <h2 id="guidance-title">Weather and field guidance</h2>
      {summary && (
        <p>
          This forecast shows a 7-day maximum of {Number.isFinite(summary.high) ? `${Math.round(summary.high)}°C` : "unavailable"}
          {summary.rainTotal == null ? ". Rain total is unavailable." : ` and about ${summary.rainTotal.toFixed(1)} mm of rain in total.`}
        </p>
      )}
      <div className="guidance-list">
        {guidanceData.map((item) => (
          <article className="guidance-item" key={item.id}>
            <h3>{item.title}</h3>
            <p><strong>{item.condition}:</strong> {item.guidance}</p>
            <p>Sources:</p>
            <ul>
              {item.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">{source.name}</a>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <p className="guidance-disclaimer">{guidanceDisclaimer}</p>
    </section>
  );
}

export default Guidance;
