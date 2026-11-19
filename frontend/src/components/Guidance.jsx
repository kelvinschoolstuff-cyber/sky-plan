// TM1. props { items } (from the API) or { weather } (computed in the browser). Optional: period, disclaimer.
import SourceLink from "./SourceLink";
import { DISCLAIMER, guidanceFromWeather } from "../data/guidanceData";
import { t } from "../i18n";

export default function Guidance({ items, weather, period, disclaimer }) {
  const list = items ?? (weather ? guidanceFromWeather(weather) : []);
  const note = disclaimer ?? (weather ? DISCLAIMER : null);
  return (
    <>
      {period && <p className="muted">{t("forecastLabel")}: {period}</p>}
      {list.length === 0 && <p className="muted">No notable weather conditions in the forecast.</p>}
      <ul className="advice">
        {list.map((a, i) => (
          <li key={i} className={a.level}>
            <b>{a.situation}</b> {a.message}
            <small>{a.basis}</small>
            {a.source_url && <small>{t("officialAdvice")}: <SourceLink name={a.source_name} url={a.source_url} /></small>}
          </li>
        ))}
      </ul>
      {note && <p className="muted">{note}</p>}
    </>
  );
}
