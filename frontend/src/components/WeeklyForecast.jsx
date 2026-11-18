// TM1. props { daily: [{ date, min, max, rain, code, prob?, wind? }] }. Rain chance and wind columns show when present.
import { describe } from "../weather";
import { t } from "../i18n";

const day = (iso) => new Date(iso + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export default function WeeklyForecast({ daily }) {
  if (!daily?.length) return null;
  const hasProb = daily.some((d) => d.prob != null);
  const hasWind = daily.some((d) => d.wind != null);
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr><th>{t("day")}</th><th>{t("condition")}</th><th>{t("temp")}</th><th>{t("rain")}</th>
            {hasProb && <th>{t("rainProb")}</th>}{hasWind && <th>{t("wind")}</th>}</tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}>
              <td>{day(d.date)}</td><td>{describe(d.code)}</td><td>{Math.round(d.min)}–{Math.round(d.max)}°C</td>
              <td className={d.rain >= 10 ? "wet" : ""}>{d.rain}</td>
              {hasProb && <td>{d.prob != null ? `${d.prob}%` : "n/a"}</td>}{hasWind && <td>{d.wind} km/h</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
