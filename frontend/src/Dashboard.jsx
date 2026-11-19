import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import { describe, getForecast } from "./weather";
import LocationSearch from "./LocationSearch";
import CountySelect from "./CountySelect";
import CropSelector from "./components/CropSelector";
import PlantingCalendar from "./components/PlantingCalendar";
import WeeklyForecast from "./components/WeeklyForecast";
import Guidance from "./components/Guidance";
import { WaterBalance } from "./Insights";
import { t } from "./i18n";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loc, setLoc] = useState({ name: "Nairobi, Kenya", lat: -1.2864, lon: 36.8172 });
  const [county, setCounty] = useState("Nairobi");
  const [wx, setWx] = useState(null);
  const [wxErr, setWxErr] = useState("");
  const [crops, setCrops] = useState([]);
  const [crop, setCrop] = useState("maize");
  const [advice, setAdvice] = useState(null);

  useEffect(() => { api.crops().then(setCrops).catch(() => {}); }, []);
  useEffect(() => {
    setWx(null); setWxErr("");
    getForecast(loc.lat, loc.lon).then(setWx).catch((e) => setWxErr(e.message));
  }, [loc]);
  useEffect(() => {
    setAdvice(null);
    api.advice(crop, loc.lat, loc.lon).then(setAdvice).catch(() => setAdvice(false));
  }, [crop, loc]);

  const c = wx?.current;
  return (
    <ol className="steps">
      <li>
        <h3>{t("step1")}</h3>
        <LocationSearch onPick={setLoc} />
        <p><b>{loc.name}</b></p>
        <CountySelect value={county} onChange={setCounty} />
      </li>
      <li>
        <h3>{t("step2")}</h3>
        <CropSelector crops={crops} value={crop} onChange={setCrop} />
      </li>
      <li>
        <h3>{t("step3")}</h3>
        <p className="tag">{t("calendarLabel")}</p>
        {county ? <PlantingCalendar crop={crop} county={county} /> : <p className="muted">{t("feedback")}</p>}
      </li>
      <li>
        <h3>{t("step4")}</h3>
        <p className="tag">{t("forecastLabel")} · {t("sourceLabel")}: Open-Meteo</p>
        {wxErr && <p className="error">{wxErr}</p>}
        {!wx && !wxErr && <p className="muted">{t("loading")}</p>}
        {c && (
          <>
            <p className="big">{Math.round(c.temperature_2m)}°C <span>{describe(c.weather_code)}</span></p>
            <p className="muted">Humidity {c.relative_humidity_2m}% · Wind {c.wind_speed_10m} km/h</p>
            <WeeklyForecast daily={wx.daily} />
          </>
        )}
        <WaterBalance lat={loc.lat} lon={loc.lon} />
      </li>
      <li>
        <h3>{t("step5")}</h3>
        <p className="tag">{t("guidanceLabel")}</p>
        {advice === null && <p className="muted">{t("loading")}</p>}
        {advice && <Guidance items={advice.items} disclaimer={advice.disclaimer} period={`${advice.forecast_from} to ${advice.forecast_to}`} />}
        {advice === false && wx && <Guidance weather={wx} />}
        {advice === false && !wx && <p className="error">{t("adviceOffline")}</p>}
        <p className="tag">{t("outlookLabel")}</p>
        <p className="muted">{t("outlookText")}</p>
      </li>
      <li>
        <h3>{t("step6")}</h3>
        <p className="muted">{t("saveHint")}</p>
        <button onClick={() => navigate("/my-farm")}>{t("myFarm")}</button>
      </li>
    </ol>
  );
}
