import { useState } from "react";

import SearchForm from "../components/SearchForm";
import CurrentWeather from "../components/CurrentWeather";
import HourlyForecast from "../components/HourlyForecast";
import WeeklyForecast from "../components/WeeklyForecast";
import Guidance from "../components/Guidance";

import { fetchWeather } from "../services/WeatherApi";

function Weather() {
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!city.trim()) return;

    setLoading(true);
    setError("");

    try {
      const result = await fetchWeather(city.trim());
      setWeatherData(result);
    } catch (err) {
      setError(err.message);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="weather-section">
      <h2>Weather Dashboard</h2>
      <p>Check weather conditions for your farming location.</p>

      <SearchForm
        city={city}
        setCity={setCity}
        onSearch={handleSearch}
        loading={loading}
      />

      {error && <p className="error-message">{error}</p>}

      {weatherData && (
        <>
          <CurrentWeather
            location={weatherData.location}
            weather={weatherData.weather}
          />
          <HourlyForecast hourly={weatherData.weather.hourly} />
          <WeeklyForecast daily={weatherData.weather.daily} />
          <Guidance weather={weatherData.weather} />
        </>
      )}
    </section>
  );
}

export default Weather;
