import en from "./locales/en.json";
import sw from "./locales/sw.json";
// Add a language: create src/locales/<code>.json, import it here, and add it to PACKS and LANGS.
// Kiswahili is a draft and needs review by a native speaker and an agricultural extension officer.
const PACKS = { en, sw };
export const LANGS = { en: "English", sw: "Kiswahili" };
export const lang = PACKS[localStorage.getItem("lang")] ? localStorage.getItem("lang") : "en";
document.documentElement.lang = lang;
export const setLang = (l) => { localStorage.setItem("lang", l); window.location.reload(); };
export const t = (key) => PACKS[lang][key] ?? en[key] ?? key;
