import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import App from "../App";
import { api } from "../api";

// The AgriCast API is DOWN (every request to localhost:8000 fails); only Open-Meteo answers.
const OPEN_METEO = {
  timezone: "Africa/Nairobi",
  current: { temperature_2m: 22, relative_humidity_2m: 60, precipitation: 0, wind_speed_10m: 9, weather_code: 1 },
  hourly: { time: ["2026-11-14T10:00"], temperature_2m: [21], precipitation_probability: [10], precipitation: [0], weather_code: [1] },
  daily: { time: ["2026-11-14", "2026-11-15"], temperature_2m_max: [27, 28], temperature_2m_min: [14, 15], precipitation_sum: [0, 35],
           precipitation_probability_max: [10, 80], wind_speed_10m_max: [12, 14], weather_code: [1, 61], et0_fao_evapotranspiration: [4, 4.5] },
};
beforeEach(() => {
  cleanup(); localStorage.clear();
  vi.stubGlobal("fetch", vi.fn(async (url) => {
    if (String(url).startsWith("http://localhost:8000")) throw new TypeError("connection refused");
    return { ok: true, json: async () => OPEN_METEO };
  }));
});
const go = (path) => render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>);

describe("frontend-only mode (no backend)", () => {
  it("says the API is not running, and still shows weather straight from Open-Meteo", async () => {
    go("/");
    expect(await screen.findByText(/Frontend-only mode/)).toBeInTheDocument();
    expect(await screen.findByText(/22°C/)).toBeInTheDocument();
  });
  it("still gives qualified guidance in the browser, with a link to official advice", async () => {
    go("/");
    expect(await screen.findByText("Heavy rainfall")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /KMD/ }).length).toBeGreaterThan(0);
  });
  it("still lists crops and counties from the offline copy", async () => {
    expect((await api.crops()).length).toBe(10);
    expect((await api.counties()).length).toBe(47);
    go("/crops");
    expect(await screen.findByText("Core crops")).toBeInTheDocument();
  });
  it("computes the water balance from Open-Meteo", async () => {
    const wb = await api.waterBalance(-1.3, 36.8);
    expect(wb.days).toHaveLength(2);
    expect(wb.rain_total).toBe(35);
    expect(wb.summary).toMatch(/reference evapotranspiration/);
  });
  it("shows a clear message for the calendar and for login instead of crashing", async () => {
    go("/crops");
    fireEvent.click(await screen.findByText("Maize"));
    fireEvent.change(await screen.findByLabelText("County"), { target: { value: "Nakuru" } });
    expect(await screen.findByText(/needs the AgriCast API/)).toBeInTheDocument();
    await expect(api.login({ email: "a@b.co", password: "x" })).rejects.toThrow(/Cannot reach the AgriCast API/);
  });
});
