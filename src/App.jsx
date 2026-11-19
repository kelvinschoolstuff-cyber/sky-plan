import { useState } from "react";
import "./App.css";

import SearchForm from "./components/SearchForm";
import CurrentWeather from "./components/CurrentWeather";
import { fetchWeather } from "./services/WeatherApi";

function App() {
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
    <div className="app">
      <header className="app-header">
        <h1>Agricast</h1>
        <p>Agricultural planning and Weather Advisory Platform</p>
        <span>Kenya</span>
      </header>

      <main>
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
            <CurrentWeather
              location={weatherData.location}
              weather={weatherData.weather}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
