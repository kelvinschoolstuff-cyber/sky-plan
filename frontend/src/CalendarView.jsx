// Source-attribution logic for calendar entries (TM3 components import from here).
import { useEffect, useState } from "react";
import { api } from "./api";
import SourceLink from "./components/SourceLink";
import { t } from "./i18n";

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const md = (s) => (s ? `${Number(s.slice(3))} ${M[Number(s.slice(0, 2)) - 1]}` : "not stated");
export const windowText = (a, b) => (a ? `${md(a)} to ${md(b || a)}` : "not stated");
export const isSample = (e) => (e.source?.organisation || "").toUpperCase().startsWith("SAMPLE");

/** Shows where a calendar record came from, plus a loud warning for SAMPLE test data. */
export default function SourceAttribution({ entry: e }) {
  const s = e.source;
  return (
    <>
      {isSample(e) && <p className="notice sample">{t("sampleData")}</p>}
      <dl>
        <dt>{t("source")}</dt>
        <dd>
          <SourceLink name={s.title} url={s.url} />, {s.organisation}{e.source_page_or_sheet && ` (${e.source_page_or_sheet})`}
        </dd>
        <dt>{t("published")}</dt>
        <dd>{s.published_date ?? "date not recorded"}{s.licence && ` · ${s.licence}`}{s.accessed_date && ` · accessed ${s.accessed_date}`}</dd>
      </dl>
      {e.source_wording && <p className="muted">Original wording: {e.source_wording}</p>}
    </>
  );
}

/** Every source behind the calendar records (GET /sources), so farmers and graders can see where the data comes from. */
export function SourcesList() {
  const [list, setList] = useState(null);
  useEffect(() => { api.sources().then(setList).catch(() => setList(false)); }, []);
  if (list === false) return <p className="error">{t("adviceOffline")}</p>;
  if (!list) return <p className="muted">{t("loading")}</p>;
  if (list.length === 0) return <p className="notice">{t("noSources")}</p>;
  return (
    <ul className="obs">
      {list.map((s) => (
        <li key={s.id}>
          <SourceLink name={s.title} url={s.url} />, {s.organisation} · {s.record_count} record(s)
          {s.licence && ` · ${s.licence}`}{s.published_date && ` · published ${s.published_date}`}
          {s.organisation.toUpperCase().startsWith("SAMPLE") && <b className="sample-tag"> SAMPLE DATA</b>}
        </li>
      ))}
    </ul>
  );
}
