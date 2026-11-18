// TM1. props { hourly: [{ time, temp, rain, prob, code }] } for the next 24 hours.
import { describe } from "../weather";
import { t } from "../i18n";

export default function HourlyForecast({ hourly }) {
  if (!hourly?.length) return null;
  return (
    <>
      <p className="tag">{t("hourlyLabel")}</p>
      <ul className="hours">
        {hourly.map((h) => (
          <li key={h.time}>
            <b>{h.time.slice(11, 16)}</b>
            <span>{Math.round(h.temp)}°C</span>
            <span>{h.rain} mm</span>
            <span className="muted">{h.prob != null ? `${h.prob}%` : "n/a"}</span>
            <small>{describe(h.code)}</small>
          </li>
        ))}
      </ul>
    </>
  );
}
