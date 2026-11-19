const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

// Find possible places that match what the user has typed.
export async function searchLocations(query) {
  const geoParams = new URLSearchParams({
    name: query,
    count: "6",
    language: "en",
    countryCode: "KE",
    format: "json",
  });

  const geoResponse = await fetch(`${GEOCODING_URL}?${geoParams}`);

  if (!geoResponse.ok) {
    throw new Error("Unable to search for this location.");
  }

  const geoData = await geoResponse.json();
  return (geoData.results ?? []).filter((location) => location.country_code === "KE");
}

// Fetch the forecast by exact coordinates or geocode a plain city name first.
export async function fetchWeather(locationOrName) {
  let location = locationOrName;

  if (typeof locationOrName === "string") {
    const locations = await searchLocations(locationOrName);

    if (locations.length === 0) {
      throw new Error("City not found. Try another location.");
    }

    [location] = locations;
  }

  const weatherParams = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,

    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",

    hourly: "temperature_2m,precipitation_probability,weather_code",

    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",

    timezone: "auto",
    forecast_days: "7",
  });

  const weatherResponse = await fetch(`${WEATHER_URL}?${weatherParams}`);

  if (!weatherResponse.ok) {
    throw new Error("Unable to retrieve weather information.");
  }

  const weatherData = await weatherResponse.json();

  // Return both the selected place and weather so the UI can show its name and conditions.
  return {
    location,
    weather: weatherData,
  };
}
