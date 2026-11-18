import { useEffect, useState } from "react";
import { describe, getForecast } from "./weather";
import LocationSearch from "./LocationSearch";
import HourlyForecast from "./components/HourlyForecast";
import WeeklyForecast from "./components/WeeklyForecast";
import { WaterBalance, OnsetHistory } from "./Insights";
import { t } from "./i18n";

export default function WeatherPage() {
  const [loc, setLoc] = useState({ name: "Nairobi, Kenya", lat: -1.2864, lon: 36.8172 });
  const [wx, setWx] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    setWx(null); setErr("");
    getForecast(loc.lat, loc.lon).then(setWx).catch((e) => setErr(e.message));
  }, [loc]);
  const c = wx?.current;
  return (
    <>
      <LocationSearch onPick={setLoc} />
      <h2 className="place">{loc.name}</h2>
      {err && <p className="error">{err}</p>}
      {!wx && !err && <p className="muted">{t("loading")}</p>}
      {c && (
        <section className="card">
          <p className="tag">Current conditions</p>
          <p className="big">{Math.round(c.temperature_2m)}°C <span>{describe(c.weather_code)}</span></p>
          <p className="muted">Humidity {c.relative_humidity_2m}% · Wind {c.wind_speed_10m} km/h · Rain now {c.precipitation} mm</p>
          <HourlyForecast hourly={wx.hourly} />
          <p className="tag">{t("forecastLabel")}: {wx.from} to {wx.to} · {t("sourceLabel")}: Open-Meteo</p>
          <WeeklyForecast daily={wx.daily} />
          <WaterBalance lat={loc.lat} lon={loc.lon} />
          <OnsetHistory lat={loc.lat} lon={loc.lon} />
          <p className="tag">{t("outlookLabel")}</p>
          <p className="muted">{t("outlookText")}</p>
        </section>
      )}
    </>
  );
}
