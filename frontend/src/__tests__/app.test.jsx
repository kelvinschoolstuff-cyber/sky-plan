import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

vi.mock("../api", () => ({
  api: { health: vi.fn(), weather: vi.fn(), crops: vi.fn(), counties: vi.fn(), advice: vi.fn(), calendar: vi.fn(), sources: vi.fn(), waterBalance: vi.fn(),
         onset: vi.fn(), farms: vi.fn(), alerts: vi.fn(), me: vi.fn(), login: vi.fn(), register: vi.fn() },
  flushQueue: vi.fn(), pending: () => 0, API_BASE: "http://localhost:8000",
}));
import { api } from "../api";
import App from "../App";
import Navbar from "../components/Navbar";

const W = { current: { temperature_2m: 22, relative_humidity_2m: 60, precipitation: 0, wind_speed_10m: 9, weather_code: 1 },
  hourly: [{ time: "2026-11-14T10:00", temp: 21, prob: 10, rain: 0, code: 1 }], from: "2026-11-14", to: "2026-11-14",
  daily: [{ date: "2026-11-14", max: 27, min: 14, rain: 0, prob: 10, wind: 12, code: 1 }] };
const CROPS = [{ key: "maize", name: "Maize", group: "Cereals", priority: "core", base: 10, upper: 30, gdd: 2200, min_plant_temp: 12, depth_cm: "5",
  spacing: "75 x 25 cm", water: "500-800 mm", reviewed: false, source_url: "https://cropcalendar.apps.fao.org/", reference_url: "https://example.org" }];
const go = (path) => render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></MemoryRouter>);

beforeEach(() => {
  cleanup(); localStorage.clear(); vi.resetAllMocks();
  api.health.mockResolvedValue({ status: "ok" }); api.weather.mockResolvedValue(W); api.crops.mockResolvedValue(CROPS); api.counties.mockResolvedValue(["Nairobi", "Nakuru"]);
  api.advice.mockResolvedValue({ items: [], forecast_from: "a", forecast_to: "b", disclaimer: "not a guarantee" });
  api.calendar.mockResolvedValue({ scope: "none", entries: [] }); api.sources.mockResolvedValue([]);
  api.waterBalance.mockResolvedValue({ days: [], summary: "s", note: "n" });
  api.onset.mockResolvedValue({ found: 0, total: 0, years: [], definition: "d", source: "s", note: "n" });
  api.farms.mockResolvedValue([]); api.alerts.mockResolvedValue([]); api.me.mockResolvedValue({ name: "Ann", phone: null, sms_alerts: false });
});

describe("shared navigation and routing", () => {
  it("renders the same Navbar on every page", async () => {
    go("/");
    expect(await screen.findByText("Choose your location")).toBeInTheDocument();
    for (const name of ["Dashboard", "Weather", "Crops", "My Farm"]) expect(screen.getByRole("link", { name })).toBeInTheDocument();
  });
  it("navigates between pages without reloading", async () => {
    go("/");
    fireEvent.click(screen.getByRole("link", { name: "Crops" }));
    expect(await screen.findByText("Core crops")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Weather" }));
    expect(await screen.findByText("Current conditions")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crops" })).toBeInTheDocument();
  });
  it("opens each page from its own URL", async () => {
    go("/crops");
    expect(await screen.findByText("Core crops")).toBeInTheDocument();
  });
  it("asks for login on My Farm, and shows the farm page when signed in", async () => {
    go("/my-farm");
    expect(await screen.findByRole("button", { name: "Log in" })).toBeInTheDocument();
    cleanup();
    localStorage.setItem("name", "Ann"); localStorage.setItem("token", "t");
    go("/my-farm");
    expect((await screen.findAllByText("Add farm")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Log out \(Ann\)/ })).toBeInTheDocument();
    expect(document.querySelector("form form")).toBeNull(); // forms must not be nested (the Search button would submit the farm form)
  });
  it("shows a friendly page for unknown URLs", async () => {
    go("/nowhere");
    expect(await screen.findByText("Page not found")).toBeInTheDocument();
  });
  it("Navbar logout calls onLogout", () => {
    const out = vi.fn();
    render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Navbar user="Ann" onLogout={out} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /Log out/ }));
    expect(out).toHaveBeenCalled();
  });
});
