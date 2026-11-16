const weatherLabels = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

function formatDay(date, index) {
  if (index === 0) return "Today";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en", {
    weekday: "short",
    timeZone: "UTC",
  });
}

function WeeklyForecast({ daily }) {
  if (!daily?.time?.length) {
    return <p role="status">Weekly forecast is unavailable.</p>;
  }

  return (
    <section aria-labelledby="weekly-forecast-title">
      <h2 id="weekly-forecast-title">7-day forecast</h2>
      <div className="forecast-strip">
        {daily.time.map((date, index) => (
          <article className={`forecast-day ${index === 0 ? "forecast-today" : ""}`} key={date}>
            <span className="forecast-day-name">{formatDay(date, index)}</span>
            <span className="forecast-description">
              {weatherLabels[daily.weather_code?.[index]] ?? "Variable conditions"}
            </span>
            <span className="forecast-temperatures">
              <strong>{daily.temperature_2m_max?.[index] == null ? "--" : `${Math.round(daily.temperature_2m_max[index])}°`}</strong>
              <span>{daily.temperature_2m_min?.[index] == null ? "--" : `${Math.round(daily.temperature_2m_min[index])}°`}</span>
            </span>
            <span className="forecast-rain">
              Rain {daily.precipitation_probability_max?.[index] == null
                ? "--"
                : `${Math.round(daily.precipitation_probability_max[index])}%`}
            </span>
            {daily.precipitation_sum?.[index] != null && (
              <span>{Number(daily.precipitation_sum[index]).toFixed(1)} mm</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default WeeklyForecast;
