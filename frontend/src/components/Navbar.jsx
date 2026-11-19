// Shared navigation, rendered once at the top of App.jsx so every page gets the same header (no per-page copies).
// props { user, onLogout }: user is the signed-in name (or null).
import { NavLink, useNavigate } from "react-router-dom";
import { LANGS, lang, setLang, t } from "../i18n";

export const NAV_LINKS = [["/", "dashboard"], ["/weather", "weather"], ["/crops", "crops"], ["/my-farm", "myFarm"]];

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <header>
      <h1>{t("app")}</h1>
      <nav aria-label="Main">
        {NAV_LINKS.map(([to, key]) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `navlink${isActive ? " on" : ""}`}>{t(key)}</NavLink>
        ))}
        <select className="lang" value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t("language")}>
          {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {user && <button onClick={() => { onLogout(); navigate("/"); }}>{t("logout")} ({user})</button>}
      </nav>
    </header>
  );
}
