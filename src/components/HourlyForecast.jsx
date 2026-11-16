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
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

function formatHour(value) {
  const hour = Number(value.slice(11, 13));
  return new Date(Date.UTC(2020, 0, 1, hour)).toLocaleTimeString("en", {
    hour: "numeric",
    timeZone: "UTC",
  });
}

function HourlyForecast({ hourly }) {
  if (!hourly?.time?.length) {
    return <p role="status">Hourly forecast is unavailable.</p>;
  }

  const firstDay = hourly.time[0].slice(0, 10);
  const entries = hourly.time
    .map((time, index) => ({
      time,
      temperature: hourly.temperature_2m?.[index],
      rainChance: hourly.precipitation_probability?.[index],
      code: hourly.weather_code?.[index],
      hour: Number(time.slice(11, 13)),
    }))
    .filter((entry) => entry.time.startsWith(firstDay))
    .filter((entry) => entry.hour >= 6 && entry.hour <= 18 && entry.hour % 2 === 0);

  return (
    <section aria-labelledby="hourly-forecast-title">
      <h2 id="hourly-forecast-title">By the hour</h2>
      <div className="hourly-strip">
        {entries.map((entry) => (
          <article className="hour-item" key={entry.time}>
            <span className="hour-time">{formatHour(entry.time)}</span>
            <span>{weatherLabels[entry.code] ?? "Variable conditions"}</span>
            <strong>{entry.temperature == null ? "--" : `${Math.round(entry.temperature)}°`}</strong>
            <span>{entry.rainChance == null ? "Rain --" : `Rain ${Math.round(entry.rainChance)}%`}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HourlyForecast;
