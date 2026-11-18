import { useEffect, useState } from "react";
import { api } from "./api";
import { t } from "./i18n";

export function WaterBalance({ lat, lon }) {
  const [d, setD] = useState(null);
  useEffect(() => { setD(null); api.waterBalance(lat, lon).then(setD).catch(() => setD(false)); }, [lat, lon]);
  if (d === false) return <p className="error">{t("adviceOffline")}</p>;
  if (!d) return <p className="muted">{t("loading")}</p>;
  return (
    <>
      <p className="tag">{t("waterBalance")}</p>
      <p>{d.summary}</p>
      <div className="scroll">
        <table>
          <thead><tr><th>{t("day")}</th><th>{t("rain")}</th><th>ET₀ (mm)</th><th>Rain − ET₀</th><th>Running total</th></tr></thead>
          <tbody>{d.days.map((x) => (
            <tr key={x.date}><td>{x.date}</td><td>{x.rain}</td><td>{x.et0}</td>
              <td className={x.balance < 0 ? "neg" : "pos"}>{x.balance}</td><td>{x.cumulative}</td></tr>
          ))}</tbody>
        </table>
      </div>
      <p className="muted">{d.note}</p>
    </>
  );
}

export function OnsetHistory({ lat, lon }) {
  const [season, setSeason] = useState("long");
  const [d, setD] = useState(null);
  useEffect(() => { setD(null); api.onset(lat, lon, season).then(setD).catch(() => setD(false)); }, [lat, lon, season]);
  return (
    <>
      <p className="tag">{t("onsetTitle")}</p>
      <label className="field">
        <select value={season} onChange={(e) => setSeason(e.target.value)} aria-label={t("onsetTitle")}>
          <option value="long">{t("longRains")}</option><option value="short">{t("shortRains")}</option>
        </select>
      </label>
      {d === false && <p className="error">{t("adviceOffline")}</p>}
      {d === null && <p className="muted">{t("loading")}</p>}
      {d && (
        <>
          <p>{d.found ? <>Onset found in <b>{d.found}</b> of {d.total} years. Typical (median) start: <b>{d.median}</b>, earliest {d.earliest}, latest {d.latest}.</>
            : "No onset found in these years with this definition."}</p>
          <div className="chips">{d.years.map((y) => <span key={y.year} className={y.onset ? "chip" : "chip none"}>{y.year}: {y.onset ? y.onset.slice(5) : "none"}</span>)}</div>
          <p className="muted">{d.definition} {d.source} {d.note}</p>
        </>
      )}
    </>
  );
}
