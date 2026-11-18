// TM2. props { crop } (one object from GET /crops). Reference values are approximate and flagged as unreviewed;
// the growing notes are a team draft and are shown with a warning until each one is checked against a source.
import CropFact from "./CropFact";
import SourceLink from "./SourceLink";
import { t } from "../i18n";

const NOTE_FIELDS = [
  ["growing_duration", "growingDuration"], ["suitable_temperature", "suitableTemp"], ["rainfall_requirements", "rainfallReq"],
  ["soil_requirements", "soilReq"], ["water_requirements", "waterReq"], ["management_practices", "managementReq"],
];

export default function CropInformation({ crop }) {
  if (!crop) return null;
  const hasNotes = NOTE_FIELDS.some(([key]) => crop[key]);
  return (
    <section>
      <h3>{crop.name} <span className="badge">{crop.group}</span> <span className="badge">{t(crop.priority)}</span></h3>
      <p className="tag">{t("draftNotes")}</p>
      {hasNotes ? (
        <>
          <p className="notice">{t("draftNotesWarning")}</p>
          <dl>{NOTE_FIELDS.map(([key, label]) => <CropFact key={key} label={t(label)} value={crop[key]} />)}</dl>
        </>
      ) : <p className="muted">{t("noNotes")}</p>}
      <p className="tag">{t("refParams")}</p>
      <dl>
        <CropFact label={t("depth")} value={crop.depth_cm} />
        <CropFact label={t("spacing")} value={crop.spacing} />
        <CropFact label={t("waterNeed")} value={crop.water} />
        <CropFact label={t("baseTemp")} value={crop.base} />
        <CropFact label="Upper temperature (°C)" value={crop.upper} />
        <CropFact label="Growing degree days to maturity" value={crop.gdd} />
        <CropFact label="Minimum planting temperature (°C)" value={crop.min_plant_temp} />
        <CropFact label={t("reviewStatus")} value={crop.reviewed ? "reviewed" : "not yet reviewed"} />
      </dl>
      <p className="muted">
        {t("verifyAt")}: <SourceLink name="FAO Crop Calendar" url={crop.source_url} />
        {crop.reference_url && <>, <SourceLink name="KALRO crop-cycle calendar" url={crop.reference_url} /></>}
      </p>
    </section>
  );
}
