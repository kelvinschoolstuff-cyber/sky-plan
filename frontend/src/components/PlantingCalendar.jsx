// TM3. props { county, crop, zone? }. Fetches the calendar and handles loading, offline, zone-level ("listed"), broader-region and no-entry states.
// zone is optional: a farm's agro-ecological zone (for example "LM3") pre-selects the matching zone when the source lists several.
import { useEffect, useState } from "react";
import { api } from "../api";
import CalendarEntry from "./CalendarEntry";
import SourceLink from "./SourceLink";
import { SOURCES } from "../data/guidanceData";
import { t } from "../i18n";

export default function PlantingCalendar({ county, crop, zone }) {
  const [data, setData] = useState(null);
  const [pick, setPick] = useState("all");
  useEffect(() => {
    setData(null);
    setPick("all");
    api.calendar(crop, county).then((d) => {
      setData(d);
      const mine = zone && d.entries.map((e) => e.agro_ecological_zone).find((z) => z && z.toLowerCase().includes(zone.trim().toLowerCase()));
      if (mine) setPick(mine);
    }).catch(() => setData(false));
  }, [crop, county, zone]);

  if (data === false) return <p className="error">{t("adviceOffline")}</p>;
  if (!data) return <p className="muted">{t("loading")}</p>;
  if (data.scope === "none") {
    return (
      <div className="notice">
        <p>{t("noCalendar")}</p>
        <p>{t("officialAdvice")}: <SourceLink {...SOURCES.agromet} /> · <SourceLink {...SOURCES.faoCalendar} /></p>
      </div>
    );
  }
  const zones = [...new Set(data.entries.map((e) => e.agro_ecological_zone).filter(Boolean))];
  const shown = pick === "all" ? data.entries : data.entries.filter((e) => e.agro_ecological_zone === pick);
  return (
    <>
      {data.scope === "broader" && <p className="notice">{t("broader")}</p>}
      {data.scope === "listed" && <p className="notice">{t("listedScope")}</p>}
      {data.scope === "listed" && zones.length > 1 && (
        <label className="field">{t("zoneFilter")}
          <select value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="all">{t("allZones")} ({data.entries.length})</option>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
      )}
      {shown.map((e) => <CalendarEntry key={e.id} entry={e} />)}
    </>
  );
}
