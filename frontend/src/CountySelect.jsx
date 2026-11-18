import { useEffect, useState } from "react";
import { api } from "./api";
import { t } from "./i18n";

export default function CountySelect({ value, onChange, required }) {
  const [list, setList] = useState([]);
  useEffect(() => { api.counties().then(setList).catch(() => {}); }, []);
  return (
    <label className="field">{t("county")}
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} required={required}>
        <option value="">{t("anyCounty")}</option>
        {list.map((c) => <option key={c}>{c}</option>)}
      </select>
    </label>
  );
}
