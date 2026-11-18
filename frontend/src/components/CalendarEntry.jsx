// TM3. props { entry } (one item from GET /calendar). Source attribution lives in ../CalendarView.jsx.
// Zone-level records (from the KALRO/FAO file) have no county: they are titled by agro-ecological zone and show the areas the source names.
import SourceAttribution, { windowText } from "../CalendarView";
import CropFact from "./CropFact";
import { t } from "../i18n";

export default function CalendarEntry({ entry: e }) {
  const title = e.county || e.agro_ecological_zone || "Broader region";
  return (
    <article className="entry">
      <p>
        <span className={`badge ${e.review_status.replace(" ", "-")}`}>{e.review_status}</span>
        {title}{e.sub_county ? `, ${e.sub_county}` : ""}
      </p>
      <dl>
        <CropFact label={t("planting")} value={windowText(e.planting_start, e.planting_end)} />
        <CropFact label={t("harvesting")} value={windowText(e.harvest_start, e.harvest_end)} />
        {e.season && <CropFact label={t("season")} value={e.season} />}
        {e.agro_ecological_zone && <CropFact label={t("zone")} value={e.agro_ecological_zone} />}
        <CropFact label={t("system")} value={e.production_system} />
        {e.administrative_areas && <CropFact label={t("areasListed")} value={e.administrative_areas} />}
      </dl>
      <SourceAttribution entry={e} />
      {e.last_reviewed_at && <p className="muted">Last reviewed {e.last_reviewed_at} (v{e.version}){e.reviewer_role && `, ${e.reviewer_role}`}</p>}
      {e.notes && <p className="muted">{e.notes}</p>}
    </article>
  );
}
