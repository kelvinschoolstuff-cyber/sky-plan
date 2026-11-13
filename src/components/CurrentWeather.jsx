function CurrentWeather({ location, weather }) {
  const current = weather.current;

  return (
    <section className="current-weather">
      <h3>
        {location.name}, {location.country}
      </h3>

      {location.admin1 && <p>{location.admin1}</p>}

      <div className="weather-details">
        <div>
          <span>Temperature</span>
          <h2>{current.temperature_2m}°C</h2>
        </div>

        <div>
          <span>Feels Like</span>
          <h2>{current.apparent_temperature}℃</h2>
        </div>

        <div>
          <span>Humidity</span>
          <h2>{current.relative_humidity}%</h2>
        </div>

        <div>
          <span>Wind speed</span>
          <h2>{current.wind_speed_10m}km/h</h2>
        </div>
      </div>
    </section>
  );
}

export default CurrentWeather;
