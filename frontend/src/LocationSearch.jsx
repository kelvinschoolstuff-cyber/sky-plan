import { useState } from "react";
import { geocode } from "./weather";
import { t } from "./i18n";

export default function LocationSearch({ onPick }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");

  const search = async () => {
    setErr("");
    try {
      const found = await geocode(q);
      setResults(found);
      if (!found.length) setErr("No places found. Check the spelling.");
    } catch (ex) { setErr(ex.message); }
  };
  const here = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => onPick({ name: "My location", lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setErr("Location access was denied. Search for a place instead.")
    );

  return (
    <div className="loc">
      {/* Not a <form>: this component is used inside other forms (Add farm), and forms cannot be nested. */}
      <div className="row" role="search">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlace")} aria-label={t("searchPlace")}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (q.trim()) search(); } }} />
        <button type="button" onClick={() => q.trim() && search()}>{t("search")}</button>
        <button type="button" className="ghost" onClick={here}>{t("useLocation")}</button>
      </div>
      {err && <p className="error">{err}</p>}
      {results.length > 0 && (
        <ul className="picks">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon}`}>
              <button className="link" onClick={() => { onPick(r); setResults([]); setQ(""); }}>{r.name}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
