import { useEffect, useState } from "react";
import { api } from "./api";
import CountySelect from "./CountySelect";
import CropInformation from "./components/CropInformation";
import PlantingCalendar from "./components/PlantingCalendar";
import { SourcesList } from "./CalendarView";
import { t } from "./i18n";

export default function Crops() {
  const [crops, setCrops] = useState(null);
  const [sel, setSel] = useState(null);
  const [county, setCounty] = useState("");
  useEffect(() => { api.crops().then(setCrops).catch(() => setCrops(false)); }, []);
  if (crops === false) return <p className="error">{t("adviceOffline")}</p>;
  if (!crops) return <p className="muted">{t("loading")}</p>;
  if (crops.length === 0) return <p className="notice">{t("noCrops")}</p>;
  const crop = crops.find((c) => c.key === sel);
  return (
    <>
      {["core", "additional", "later"].map((pr) => (
        <section key={pr}>
          <h3>{t(pr)}</h3>
          <div className="cards">
            {crops.filter((c) => c.priority === pr).map((c) => (
              <button key={c.key} className={`cropcard ${sel === c.key ? "on" : ""}`} onClick={() => setSel(c.key)}>
                <b>{c.name}</b><span>{c.group}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {crop && (
        <section className="card">
          <CountySelect value={county} onChange={setCounty} />
          <p className="tag">{t("calendarLabel")}</p>
          {county ? <PlantingCalendar crop={crop.key} county={county} /> : <p className="muted">{t("feedback")}</p>}
          <CropInformation crop={crop} />
        </section>
      )}
      <section className="card">
        <h3>{t("sourcesTitle")}</h3>
        <SourcesList />
      </section>
    </>
  );
}
