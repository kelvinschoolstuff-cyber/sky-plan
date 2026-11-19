import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import "./App.css";
import { fetchWeather, searchLocations } from "./services/WeatherApi";

// Open-Meteo weather codes are translated into short labels and symbols for the forecast UI.
const weatherDescriptions = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

const weatherSymbols = {
  0: "☀",
  1: "☀",
  2: "◐",
  3: "☁",
  45: "≋",
  48: "≋",
  51: "☂",
  53: "☂",
  55: "☂",
  61: "☂",
  63: "☂",
  65: "☂",
  71: "❄",
  73: "❄",
  75: "❄",
  80: "☂",
  81: "☂",
  82: "☂",
  95: "⚡",
  96: "⚡",
  99: "⚡",
};

function getWeatherDescription(code) {
  return weatherDescriptions[code] ?? "Variable conditions";
}

function getWeatherSymbol(code) {
  return weatherSymbols[code] ?? "◌";
}

// Restore the last selected place, supporting both saved coordinates and older saved city names.
function readSavedLocation() {
  const savedLocation = localStorage.getItem("agricast-location");
  if (!savedLocation) return null;

  try {
    const location = JSON.parse(savedLocation);
    if (location?.name && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
      return location;
    }
  } catch {
    return savedLocation;
  }

  return savedLocation;
}

function formatLocationLabel(location) {
  // Combine region details so suggestions distinguish places with similar names.
  return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
}

// Turn the next five days of rain and temperature data into a cautious general planting note.
function getPlantingAdvice(weather) {
  const rain = weather.daily.precipitation_sum.slice(0, 5).reduce((sum, amount) => sum + amount, 0);
  const averageHigh = weather.daily.temperature_2m_max
    .slice(0, 5)
    .reduce((sum, temperature) => sum + temperature, 0) / 5;

  if (rain >= 20 && averageHigh >= 18 && averageHigh <= 32) {
    return {
      status: "Good conditions",
      title: "A promising window for sowing",
      detail: "Rain is expected over the next few days, with warm temperatures. Check that your soil is workable before planting.",
      tone: "good",
      crop: "Maize & beans",
    };
  }

  if (rain < 8) {
    return {
      status: "Plan for dry weather",
      title: "Conserve moisture before planting",
      detail: "Little rain is forecast in the coming days. Consider waiting for a reliable shower or prepare irrigation and mulch.",
      tone: "caution",
      crop: "Drought-tolerant crops",
    };
  }

  if (averageHigh > 32) {
    return {
      status: "Heat watch",
      title: "Protect young crops from heat",
      detail: "High daytime temperatures may stress seedlings. Water early, use shade where practical, and check local guidance.",
      tone: "caution",
      crop: "Heat-resilient varieties",
    };
  }

  return {
    status: "Mixed conditions",
    title: "Keep an eye on the next shower",
    detail: "Conditions are variable. Use local soil moisture and seasonal advice to decide when to sow.",
    tone: "neutral",
    crop: "Review your field conditions",
  };
}

function formatDay(date, index) {
  if (index === 0) return "Today";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en", {
    weekday: "short",
    timeZone: "UTC",
  });
}

// Shared header links let users move between the forecast and the project explanation.
function SiteHeader() {
  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Agricast home">
        <span className="brand-mark" aria-hidden="true">A</span>
        <span>Agricast</span>
      </Link>
      <div className="topbar-meta"><span className="live-dot" /> Local weather for better growing</div>
      <nav className="topbar-nav" aria-label="Main navigation">
        <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link nav-link-active" : "nav-link"}>Forecast</NavLink>
        <NavLink to="/project" className={({ isActive }) => isActive ? "nav-link nav-link-active" : "nav-link"}>About</NavLink>
      </nav>
    </header>
  );
}

// Shared footer keeps the attribution and forecast disclaimer visible on every route.
function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>AGRICAST <span className="footer-separator">/</span> PLAN CLOSE TO THE LAND</span>
      <span>Forecasts can change. Check conditions before field work.</span>
    </footer>
  );
}

// Explain the problem, Phase 1 scope, walkthrough, and weather API decisions.
function ProjectStory() {
  return (
    <main className="project-page">
      {/* Introduce Agricast and link back to its live forecast. */}
      <section className="project-intro">
        <p className="eyebrow">PROJECT NOTES <span>/ PHASE 01</span></p>
        <h1>Weather context for the next field decision.</h1>
        <p>Agricast helps farmers explore local conditions before deciding when to prepare or plant. It turns a public forecast into a simple, location-based planning view.</p>
        <Link className="project-cta" to="/">Open the live forecast <span aria-hidden="true">→</span></Link>
      </section>

      {/* Summarize the problem, solution, and limits of the Phase 1 idea. */}
      <section className="project-principles" aria-label="Project scope">
        <article>
          <span className="principle-number">01 / PROBLEM</span>
          <h2>Weather affects field timing.</h2>
          <p>Farmers need an understandable local forecast when weighing sowing and field-work decisions, not a wall of raw weather data.</p>
        </article>
        <article>
          <span className="principle-number">02 / SOLUTION</span>
          <h2>One place to scan the week.</h2>
          <p>Search a town to view current conditions, hourly rain chances, a seven-day forecast, and a short weather-based field note.</p>
        </article>
        <article>
          <span className="principle-number">03 / BOUNDARY</span>
          <h2>Useful context, not a promise.</h2>
          <p>The planting note is a simple weather heuristic. It does not account for soil, crop variety, pests, or a local planting calendar.</p>
        </article>
      </section>

      {/* Provide a short sequence for demonstrating the working application. */}
      <section className="project-process">
        <div>
          <p className="eyebrow">LIVE WALKTHROUGH</p>
          <h2>From location to field note.</h2>
        </div>
        <ol className="walkthrough-list">
          <li><span>01</span><p><strong>Choose a location.</strong> Enter a city or town. On later visits, your last searched place loads automatically.</p></li>
          <li><span>02</span><p><strong>Read the forecast.</strong> Compare current temperature, humidity, wind, rainfall, hourly conditions, and the week ahead.</p></li>
          <li><span>03</span><p><strong>Consider the field note.</strong> Rain and temperature thresholds produce a general prompt, with a reminder to check local conditions.</p></li>
        </ol>
      </section>

      {/* Explain the API choice and how a backend can replace it in a later phase. */}
      <section className="project-technical">
        <div>
          <p className="eyebrow">TECHNICAL CHOICES</p>
          <h2>Public data, replaceable service.</h2>
        </div>
        <div>
          <p>Open-Meteo provides location search and weather data without an API key, so the Phase 1 React app can work directly with a public API. The request and response mapping live in a separate service module, keeping the display layer independent from the provider.</p>
          <p>In later phases, that service boundary can point to a Flask API. This release has no backend, database, or accounts; it stores only your last searched place in this browser.</p>
          <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Open-Meteo API documentation <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </main>
  );
}

// Give unknown client-side routes a clear way back to the forecast.
function NotFound() {
  return (
    <main className="project-page not-found-page">
      <p className="eyebrow">404 / FIELD NOT FOUND</p>
      <h1>This page is outside the field.</h1>
      <Link className="project-cta" to="/">Return to the forecast <span aria-hidden="true">→</span></Link>
    </main>
  );
}

// The dashboard owns location search, forecast loading, and all forecast presentation.
function Dashboard() {
  // Keep the search field and the saved-location loading state in sync on startup.
  const [city, setCity] = useState(() => {
    const savedLocation = readSavedLocation();
    return typeof savedLocation === "string" ? savedLocation : savedLocation?.name ?? "";
  });
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(readSavedLocation()));
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  // Wait briefly after typing before asking the geocoding API for matching places.
  useEffect(() => {
    const query = city.trim();
    if (!suggestionsEnabled || query.length < 2) return undefined;

    let active = true;
    const timeoutId = setTimeout(() => {
      setSuggestionsLoading(true);
      searchLocations(query)
        .then((locations) => {
          if (!active) return;
          setSuggestions(locations);
          setSuggestionsOpen(locations.length > 0);
          setActiveSuggestion(-1);
        })
        .catch(() => {
          if (!active) return;
          setSuggestions([]);
          setSuggestionsOpen(false);
        })
        .finally(() => {
          if (active) setSuggestionsLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [city, suggestionsEnabled]);

  // Fetch current and forecast weather for a typed name or a selected geocoding result.
  async function loadWeather(locationOrName) {
    setLoading(true);
    setError("");
    setSuggestionsOpen(false);

    try {
      const location = typeof locationOrName === "string" ? locationOrName.trim() : locationOrName;
      const result = await fetchWeather(location);
      setWeatherData(result);
      setCity(result.location.name);
      localStorage.setItem("agricast-location", JSON.stringify(result.location));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // On later visits, refresh the forecast for the last selected place.
  useEffect(() => {
    let active = true;
    const savedLocation = readSavedLocation();

    if (!savedLocation) return undefined;

    fetchWeather(savedLocation)
      .then((result) => {
        if (!active) return;
        setWeatherData(result);
        setCity(result.location.name);
        localStorage.setItem("agricast-location", JSON.stringify(result.location));
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Submitting the form searches the text when no suggestion was selected.
  function handleSearch(event) {
    event.preventDefault();
    if (city.trim()) loadWeather(city);
  }

  // Update suggestions as the user types; clearing the field also clears saved weather.
  function handleLocationChange(event) {
    const nextCity = event.target.value;
    setCity(nextCity);
    setSuggestionsEnabled(true);
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);

    if (!nextCity.trim()) {
      localStorage.removeItem("agricast-location");
      setWeatherData(null);
      setError("");
      setSuggestions([]);
    }
  }

  // Fetch weather for the exact coordinates in a chosen suggestion.
  function chooseSuggestion(location) {
    setSuggestionsEnabled(false);
    setSuggestionsOpen(false);
    setSuggestions([]);
    setCity(location.name);
    loadWeather(location);
  }

  // Allow the location suggestion list to be used with arrow keys, Enter, and Escape.
  function handleLocationKeyDown(event) {
    if (!suggestionsOpen || suggestions.length === 0) {
      if (event.key === "Escape") setSuggestionsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeSuggestion >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  // Prepare local display values from the API response for the dashboard sections.
  const weather = weatherData?.weather;
  const current = weather?.current;
  const todayHours = weather?.hourly.time
    .map((time, index) => ({
      time: new Date(`${time.slice(0, 10)}T${time.slice(11, 16)}:00Z`).toLocaleTimeString("en", {
        hour: "numeric",
        timeZone: "UTC",
      }),
      temperature: Math.round(weather.hourly.temperature_2m[index]),
      rain: weather.hourly.precipitation_probability[index],
      code: weather.hourly.weather_code[index],
      hour: Number(time.slice(11, 13)),
    }))
    .filter(({ hour }) => hour >= 6 && hour <= 18)
    .filter((_, index) => index % 2 === 0)
    .slice(0, 7);
  const plantingAdvice = weather ? getPlantingAdvice(weather) : null;
  const today = new Date().toLocaleDateString("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: weatherData?.weather.timezone ?? "UTC",
  });

  return (
      <main id="home" className="dashboard">
        {/* Introductory copy and accessible location search with live suggestions. */}
        <section className="welcome-row">
          <div>
            <p className="eyebrow">YOUR FARM, IN SEASON</p>
            <h1>Plan with the weather.</h1>
            <p className="welcome-copy">A clearer forecast for the decisions you make in the field.</p>
          </div>
          <form className="location-search" onSubmit={handleSearch}>
            <label htmlFor="location-search">FARM LOCATION</label>
            <div className="location-entry">
              <div className="search-control">
                <span className="search-pin" aria-hidden="true">⌖</span>
                <input
                  id="location-search"
                  type="search"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={suggestionsOpen}
                  aria-controls="location-suggestions"
                  aria-activedescendant={activeSuggestion >= 0 ? `location-option-${activeSuggestion}` : undefined}
                  value={city}
                  onChange={handleLocationChange}
                  onKeyDown={handleLocationKeyDown}
                  onFocus={() => setSuggestionsEnabled(true)}
                  onBlur={() => setSuggestionsOpen(false)}
                  placeholder="Search a Kenyan city or town"
                />
                <button type="submit" disabled={loading || !city.trim()} aria-label="Search location">
                  {loading ? "..." : "→"}
                </button>
              </div>
              {suggestionsOpen && (
                <div className="location-suggestions" id="location-suggestions" role="listbox" aria-label="Matching places">
                  {suggestions.map((location, index) => (
                    <button
                      className={`location-suggestion ${index === activeSuggestion ? "location-suggestion-active" : ""}`}
                      id={`location-option-${index}`}
                      key={`${location.latitude}-${location.longitude}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestion}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSuggestion(location)}
                    >
                      <strong>{location.name}</strong>
                      <span>{formatLocationLabel({ ...location, name: undefined }) || location.country}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestionsLoading && city.trim().length >= 2 && (
                <span className="suggestion-status" role="status">Finding Kenyan places...</span>
              )}
            </div>
          </form>
        </section>

        {error && <p className="error-message" role="alert">{error}</p>}

        {/* Show a loading state or location prompt until a forecast is available. */}
        {loading && !weatherData && <div className="loading-state">Gathering local conditions...</div>}

        {!loading && !weatherData && !error && (
          <div className="location-prompt">
            <span className="prompt-mark" aria-hidden="true">⌖</span>
            <h2>Where is your farm?</h2>
            <p>Type a Kenyan town or city above to see its weather forecast.</p>
          </div>
        )}

        {/* Forecast cards are rendered only after weather data has loaded successfully. */}
        {weatherData && current && (
          <>
            {/* Current conditions sit beside the weather-based planting note. */}
            <section className="overview-grid" aria-label="Current farm weather">
              <article className="weather-hero">
                <div className="weather-hero-top">
                  <div>
                    <p className="eyebrow eyebrow-light">CURRENT CONDITIONS</p>
                    <h2>{weatherData.location.name}<span>{weatherData.location.country}</span></h2>
                    <p className="weather-date">{today}{weatherData.location.admin1 ? ` · ${weatherData.location.admin1}` : ""}</p>
                  </div>
                  <span className="hero-weather-symbol" aria-hidden="true">{getWeatherSymbol(current.weather_code)}</span>
                </div>
                <div className="temperature-row">
                  <strong>{Math.round(current.temperature_2m)}°</strong>
                  <div><span>{getWeatherDescription(current.weather_code)}</span><small>Feels like {Math.round(current.apparent_temperature)}°</small></div>
                </div>
                <div className="hero-stats">
                  <div><span className="stat-icon">◉</span><span>Humidity</span><strong>{current.relative_humidity_2m}%</strong></div>
                  <div><span className="stat-icon">↗</span><span>Wind</span><strong>{Math.round(current.wind_speed_10m)} <small>km/h</small></strong></div>
                  <div><span className="stat-icon">☂</span><span>Rain today</span><strong>{Math.round(weather.daily.precipitation_sum[0])} <small>mm</small></strong></div>
                </div>
              </article>

              <article className={`planting-card planting-${plantingAdvice.tone}`}>
                <div className="planting-heading"><span className="leaf-mark" aria-hidden="true">✳</span><span>FIELD NOTE <span className="note-number">/ 01</span></span></div>
                <p className="recommendation-status">{plantingAdvice.status}</p>
                <h2>{plantingAdvice.title}</h2>
                <p className="planting-detail">{plantingAdvice.detail}</p>
                <div className="crop-suggestion"><span>Consider</span><strong>{plantingAdvice.crop}</strong></div>
                <p className="advice-caveat">General weather guidance, not a substitute for local agronomy advice.</p>
              </article>
            </section>

            {/* Compare daily high/low temperatures and rain chance for the coming week. */}
            <section className="forecast-section" aria-labelledby="forecast-heading">
              <div className="section-heading">
                <div><p className="eyebrow">LOOKING AHEAD</p><h2 id="forecast-heading">The week, at a glance</h2></div>
                <span className="section-unit">7 DAY FORECAST</span>
              </div>
              <div className="forecast-strip">
                {weather.daily.time.map((date, index) => (
                  <article className={`forecast-day ${index === 0 ? "forecast-today" : ""}`} key={date}>
                    <span className="forecast-day-name">{formatDay(date, index)}</span>
                    <span className="forecast-symbol" aria-hidden="true">{getWeatherSymbol(weather.daily.weather_code[index])}</span>
                    <span className="forecast-description">{getWeatherDescription(weather.daily.weather_code[index])}</span>
                    <span className="forecast-temperatures"><strong>{Math.round(weather.daily.temperature_2m_max[index])}°</strong><span>{Math.round(weather.daily.temperature_2m_min[index])}°</span></span>
                    <span className="forecast-rain">☂ {Math.round(weather.daily.precipitation_probability_max[index] ?? 0)}%</span>
                  </article>
                ))}
              </div>
            </section>

            {/* Show today's selected hourly readings and explain how to use the forecast. */}
            <section className="lower-grid">
              <article className="hourly-section" aria-labelledby="hourly-heading">
                <div className="section-heading compact-heading">
                  <div><p className="eyebrow">TODAY</p><h2 id="hourly-heading">By the hour</h2></div>
                  <span className="section-unit">TEMPERATURE · RAIN</span>
                </div>
                <div className="hourly-strip">
                  {todayHours.map(({ time, temperature, rain, code }, index) => (
                    <div className="hour-item" key={`${time}-${index}`}>
                      <span className="hour-time">{time}</span>
                      <span className="hour-symbol" aria-hidden="true">{getWeatherSymbol(code)}</span>
                      <strong>{temperature}°</strong>
                      <span className="hour-rain">{rain}%</span>
                    </div>
                  ))}
                </div>
              </article>

              <aside className="season-note">
                <span className="season-index">01 — GROWING CONDITIONS</span>
                <h2>Weather is one part of the picture.</h2>
                <p>Pair this forecast with what you know about your soil, seed variety, and local planting calendar.</p>
                <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Weather data by Open-Meteo <span aria-hidden="true">↗</span></a>
              </aside>
            </section>
          </>
        )}
      </main>
  );
}

function App() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project" element={<ProjectStory />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SiteFooter />
    </div>
  );
}

export default App;
