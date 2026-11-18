import { useState } from "react";
import { api } from "./api";
import { t } from "./i18n";

export default function Auth({ onDone }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = mode === "login" ? await api.login({ email: f.email, password: f.password }) : await api.register(f);
      localStorage.setItem("token", res.token);
      localStorage.setItem("name", res.name);
      onDone(res.name);
    } catch (ex) { setErr(ex.message); }
  };

  return (
    <form className="card narrow" onSubmit={submit}>
      <p className="muted">{t("loginNeeded")}</p>
      {mode === "register" && <label className="field">{t("name")}<input value={f.name} onChange={set("name")} required /></label>}
      <label className="field">{t("email")}<input type="email" value={f.email} onChange={set("email")} required /></label>
      <label className="field">{t("password")}<input type="password" minLength={8} value={f.password} onChange={set("password")} required /></label>
      {err && <p className="error">{err}</p>}
      <button>{mode === "login" ? t("login") : t("register")}</button>
      <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? t("register") : t("login")}
      </button>
    </form>
  );
}
