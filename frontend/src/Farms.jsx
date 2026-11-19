import { useEffect, useState } from "react";
import { api } from "./api";
import LocationSearch from "./LocationSearch";
import CountySelect from "./CountySelect";
import PlantingCalendar from "./components/PlantingCalendar";
import CropSelector from "./components/CropSelector";
import Guidance from "./components/Guidance";
import { md } from "./CalendarView";
import { t } from "./i18n";

const today = () => new Date().toISOString().slice(0, 10);
const STATUSES = ["planned", "growing", "harvested"];

function Reminders({ pid }) {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ due_date: today(), text: "" });
  const load = () => api.reminders(pid).then(setList).catch(() => {});
  useEffect(() => { load(); }, [pid]);
  const add = async (e) => {
    e.preventDefault();
    await api.addReminder(pid, f);
    setF({ ...f, text: "" });
    load();
  };
  return (
    <details>
      <summary>{t("reminders")} ({list.filter((r) => !r.done).length})</summary>
      <form onSubmit={add} className="row wrap">
        <input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} aria-label={t("dueDate")} required />
        <input placeholder={t("reminderText")} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} required />
        <button>{t("addReminder")}</button>
      </form>
      <ul className="obs">
        {list.map((r) => (
          <li key={r.id}>
            <label><input type="checkbox" checked={r.done} onChange={async () => { await api.toggleReminder(r.id); load(); }} /> <b>{r.due_date}</b> {r.text}</label>
          </li>
        ))}
      </ul>
    </details>
  );
}

function WindowCheck({ w }) {
  if (!w) return null;
  const text = w.status === "inside" ? t("inside") : w.status === "outside" ? t("outside") : t("noEntryWindow");
  return (
    <>
      <p className="tag">{t("windowCheck")}</p>
      <p className={w.status === "outside" ? "notice" : ""}>{text}{w.scope === "broader" && " (broader region)"}{w.scope === "listed" && ` (${t("zoneLevel")})`}</p>
      {w.status === "outside" && <p className="muted">{w.windows.map((x) => `${md(x.start)} to ${md(x.end)}${x.season ? ` (${x.season})` : ""}`).join("; ")}</p>}
    </>
  );
}

function RainCheck({ pid, refreshKey }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.rainCheck(pid).then(setD).catch(() => setD(null)); }, [pid, refreshKey]);
  return (
    <details>
      <summary>{t("rainCheck")}</summary>
      {!d || d.pairs.length === 0 ? <p className="muted">{t("rainCheckHint")}</p> : (
        <>
          <p>Average difference: <b>{d.mean_abs_diff} mm/day</b> over {d.pairs.length} recorded day(s).</p>
          <div className="scroll"><table>
            <thead><tr><th>{t("day")}</th><th>Your gauge (mm)</th><th>Modelled (mm)</th><th>Difference</th></tr></thead>
            <tbody>{d.pairs.map((x) => <tr key={x.date}><td>{x.date}</td><td>{x.observed}</td><td>{x.modelled}</td><td>{x.difference}</td></tr>)}</tbody>
          </table></div>
          <p className="muted">{d.note}</p>
        </>
      )}
    </details>
  );
}

function Planting({ p, farm, onChanged }) {
  const [notice, setNotice] = useState("");
  const [rk, setRk] = useState(0);
  const [pr, setPr] = useState(null);
  const [obs, setObs] = useState([]);
  const [err, setErr] = useState("");
  const [f, setF] = useState({ observed_on: today(), growth_stage: "", rainfall_mm: "", notes: "" });

  const load = () => {
    api.progress(p.id).then(setPr).catch((e) => setErr(e.message));
    api.observations(p.id).then(setObs).catch(() => {});
  };
  useEffect(() => { load(); }, [p.id]);

  const save = async (e) => {
    e.preventDefault();
    const res = await api.addObservation(p.id, {
      observed_on: f.observed_on, growth_stage: f.growth_stage || null,
      rainfall_mm: f.rainfall_mm === "" ? null : Number(f.rainfall_mm), notes: f.notes || null,
    });
    setNotice(res?.queued ? t("offlineSaved") : "");
    setRk((n) => n + 1);
    setF({ ...f, rainfall_mm: "", notes: "" });
    load();
  };

  return (
    <div className="planting">
      <div className="row between">
        <h4>{p.crop_name} <span className="muted">planted {p.planting_date}</span></h4>
        <select value={p.status} aria-label={t("status")} onChange={async (e) => { await api.setStatus(p.id, e.target.value); onChanged(); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
        </select>
      </div>
      {err && <p className="error">{err}</p>}
      {pr && (
        <>
          <p className="tag">{t("tracker")}</p>
          <div className="bar" role="progressbar" aria-valuenow={pr.percent} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${pr.percent}%` }} /></div>
          <p><b>{pr.percent}%</b> · {Math.round(pr.accumulated_gdd)} of {pr.target_gdd} GDD · {t("stage")}: <b>{pr.stage}</b></p>
          <p>{t("harvest")}: <b>{pr.harvest_earliest ?? "unknown"}{pr.harvest_latest && pr.harvest_latest !== pr.harvest_earliest ? ` to ${pr.harvest_latest}` : ""}</b></p>
          <p className="muted">{pr.basis}</p>
          <p className="tag">{t("guidanceLabel")}</p>
          <Guidance items={pr.guidance} />
          <WindowCheck w={pr.window_check} />
        </>
      )}
      <RainCheck pid={p.id} refreshKey={rk} />
      <details>
        <summary>{t("planting")} calendar</summary>
        <PlantingCalendar crop={p.crop} county={farm.county} zone={farm.agro_ecological_zone} />
      </details>
      <Reminders pid={p.id} />
      <details>
        <summary>{t("observations")} ({obs.length})</summary>
        <form onSubmit={save} className="row wrap">
          <input type="date" value={f.observed_on} onChange={(e) => setF({ ...f, observed_on: e.target.value })} required />
          <input placeholder={t("stage")} value={f.growth_stage} onChange={(e) => setF({ ...f, growth_stage: e.target.value })} />
          <input type="number" min="0" step="0.1" placeholder={t("rain")} value={f.rainfall_mm} onChange={(e) => setF({ ...f, rainfall_mm: e.target.value })} />
          <input placeholder={t("notes")} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <button>{t("saveObservation")}</button>
        </form>
        {notice && <p className="notice">{notice}</p>}
        <ul className="obs">
          {obs.map((o) => <li key={o.id}><b>{o.observed_on}</b> {o.growth_stage} {o.rainfall_mm != null && `· ${o.rainfall_mm} mm`} {o.notes && `· ${o.notes}`}</li>)}
        </ul>
      </details>
    </div>
  );
}

function PlantingForm({ farmId, crops, onAdded }) {
  const [crop, setCrop] = useState("maize");
  const [date, setDate] = useState(today());
  const add = async (e) => {
    e.preventDefault();
    await api.addPlanting(farmId, { crop, planting_date: date, status: "growing" });
    onAdded();
  };
  return (
    <form onSubmit={add} className="row wrap">
      <CropSelector crops={crops} value={crop} onChange={setCrop} label={false} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t("plantingDate")} required />
      <button>{t("addPlanting")}</button>
    </form>
  );
}

function Alerts({ refreshKey }) {
  const [list, setList] = useState(null);
  useEffect(() => { api.alerts().then(setList).catch(() => setList([])); }, [refreshKey]);
  if (!list) return null;
  return (
    <section className="card">
      <h3>{t("alerts")}</h3>
      {list.length === 0 ? <p className="muted">{t("noAlerts")}</p> : (
        <ul className="advice">{list.map((a, i) => <li key={i} className={a.level}><b>{a.farm_crop}</b> {a.message}</li>)}</ul>
      )}
    </section>
  );
}

function Settings() {
  const [m, setM] = useState(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { api.me().then(setM).catch(() => {}); }, []);
  if (!m) return null;
  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    try { await api.updateMe({ phone: m.phone || null, sms_alerts: m.sms_alerts }); setMsg(t("saved")); }
    catch (ex) { setMsg(ex.message); }
  };
  return (
    <details className="card">
      <summary>{t("account")}</summary>
      <form onSubmit={save}>
        <label className="field">{t("phone")}<input value={m.phone || ""} placeholder="+2547…" onChange={(e) => setM({ ...m, phone: e.target.value })} /></label>
        <label><input type="checkbox" checked={m.sms_alerts} onChange={(e) => setM({ ...m, sms_alerts: e.target.checked })} /> {t("smsOpt")}</label>
        <p><button>{t("save") === "save" ? "Save" : t("save")}</button> <span className="muted">{msg}</span></p>
      </form>
    </details>
  );
}

export default function Farms() {
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [f, setF] = useState({ name: "", county: "", sub_county: "", agro_ecological_zone: "", production_system: "rain-fed" });
  const [loc, setLoc] = useState(null);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(0);

  const load = () => { api.farms().then(setFarms).catch((e) => setErr(e.message)); setTick((n) => n + 1); };
  useEffect(() => { load(); api.crops().then(setCrops).catch(() => {}); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    if (!loc) return setErr("Search for the farm's location first.");
    setErr("");
    try {
      await api.addFarm({ name: f.name, latitude: loc.lat, longitude: loc.lon, county: f.county || null,
        sub_county: f.sub_county || null, agro_ecological_zone: f.agro_ecological_zone || null, production_system: f.production_system });
      setF({ ...f, name: "", sub_county: "", agro_ecological_zone: "" }); setLoc(null); load();
    } catch (ex) { setErr(ex.message); }
  };

  return (
    <>
      <Alerts refreshKey={tick} />
      <Settings />
      <form className="card" onSubmit={add}>
        <h3>{t("addFarm")}</h3>
        <label className="field">{t("farmName")}<input value={f.name} onChange={set("name")} required /></label>
        <LocationSearch onPick={setLoc} />
        {loc && <p className="muted">Location: {loc.name}</p>}
        <CountySelect value={f.county} onChange={(v) => setF({ ...f, county: v })} required />
        <label className="field">{t("subCounty")}<input value={f.sub_county} onChange={set("sub_county")} /></label>
        <label className="field">{t("zoneOptional")}<input value={f.agro_ecological_zone} onChange={set("agro_ecological_zone")} /></label>
        <label className="field">{t("system")}
          <select value={f.production_system} onChange={set("production_system")}>
            <option value="rain-fed">{t("rainfed")}</option><option value="irrigated">{t("irrigated")}</option>
          </select>
        </label>
        {err && <p className="error">{err}</p>}
        <button>{t("addFarm")}</button>
      </form>
      {farms.length === 0 && <p className="muted">{t("noFarms")}</p>}
      {farms.map((farm) => (
        <section className="card" key={farm.id}>
          <div className="row between">
            <h3>{farm.name} <span className="muted">{[farm.county, farm.production_system].filter(Boolean).join(" · ")}</span></h3>
            <button className="link" onClick={async () => { await api.deleteFarm(farm.id); load(); }}>{t("deleteFarm")}</button>
          </div>
          {farm.plantings.map((p) => <Planting key={p.id} p={p} farm={farm} onChanged={load} />)}
          <PlantingForm farmId={farm.id} crops={crops} onAdded={load} />
        </section>
      ))}
    </>
  );
}
