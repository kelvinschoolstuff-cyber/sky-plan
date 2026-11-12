const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

export async function fetchWeather(city) {
  const geoParams = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json",
  });

  const geoResponse = await fetch(`${GEOCODING_URL}?${geoParams}`);

  if (!geoResponse.ok) {
    throw new Error("Unable to search for this location.");
  }

  const geoData = await geoResponse.json();

  if (!geoData.results || geoData.results.length === 0) {
    throw new Error("City not found. Try another location.");
  }

  const location = geoData.results[0];

  const weatherParams = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,

    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",

    hourly: "temperature_2m,precipitation_probability,weather_code",

    daily: "weather_code,temperature_2m_max,temperature_2m_min",

    timezone: "auto",
    forecast_days: "7",
  });

  const weatherResponse = await fetch(`${WEATHER_URL}?${weatherParams}`);

  if (!weatherResponse.ok) {
    throw new Error("Unable to retrieve weather information.");
  }

  const weatherData = await weatherResponse.json();

  return {
    location,
    weather: weatherData,
  };
}
