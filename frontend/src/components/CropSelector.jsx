// TM2. props { crops, value, onChange }. crops = array from GET /crops. onChange receives the crop key.
import { t } from "../i18n";

export default function CropSelector({ crops = [], value, onChange, label = true }) {
  const select = (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={t("crop")}>
      {crops.length === 0 && <option value={value}>{value}</option>}
      {["core", "additional", "later"].map((pr) => {
        const list = crops.filter((c) => c.priority === pr);
        return list.length > 0 && (
          <optgroup key={pr} label={t(pr)}>{list.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}</optgroup>
        );
      })}
    </select>
  );
  return label ? <label className="field">{t("crop")}{select}</label> : select;
}
