import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../api", () => ({ api: { calendar: vi.fn(), sources: vi.fn() }, flushQueue: vi.fn(), pending: () => 0 }));
import { api } from "../api";
import PlantingCalendar from "../components/PlantingCalendar";
import SourceLink from "../components/SourceLink";
import Guidance from "../components/Guidance";
import { SourcesList } from "../CalendarView";

const entry = (org) => ({ id: 1, county: null, sub_county: null, agro_ecological_zone: null, season: "Long rains", production_system: "rain-fed",
  planting_start: "03-01", planting_end: "04-15", harvest_start: null, harvest_end: null, source_page_or_sheet: "Sheet 2", source_wording: null,
  review_status: "draft", reviewer_role: null, last_reviewed_at: null, version: 1, notes: null,
  source: { organisation: org, title: "Crop cycle calendar", url: "https://example.org/x", licence: "CC BY 4.0", published_date: null, accessed_date: null } });
beforeEach(() => { cleanup(); vi.resetAllMocks(); });

describe("calendar empty and error states", () => {
  it("shows a friendly message and official links when there is no entry", async () => {
    api.calendar.mockResolvedValue({ scope: "none", entries: [] });
    render(<PlantingCalendar crop="maize" county="Nakuru" />);
    expect(await screen.findByText(/No planting calendar is available for this crop in this county yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "KMD Agrometeorology" })).toHaveAttribute("href", "https://meteo.go.ke/Services/agrometeorology/");
  });
  it("does not crash when the API is down", async () => {
    api.calendar.mockRejectedValue(new Error("offline"));
    render(<PlantingCalendar crop="maize" county="Nakuru" />);
    expect(await screen.findByText(/needs the AgriCast API/)).toBeInTheDocument();
  });
  it("flags broader-region entries and shows the source link", async () => {
    api.calendar.mockResolvedValue({ scope: "broader", entries: [entry("KALRO")] });
    render(<PlantingCalendar crop="maize" county="Kisumu" />);
    expect((await screen.findAllByText(/broader region/i)).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Crop cycle calendar" })).toHaveAttribute("href", "https://example.org/x");
    expect(screen.queryByText(/SAMPLE DATA/)).toBeNull();
  });
  it("warns loudly on SAMPLE data", async () => {
    api.calendar.mockResolvedValue({ scope: "county", entries: [entry("SAMPLE DATA (not a real source)")] });
    render(<PlantingCalendar crop="maize" county="Nakuru" />);
    expect(await screen.findByText(/SAMPLE DATA for testing only/)).toBeInTheDocument();
  });
});

describe("attribution", () => {
  it("SourceLink renders a link or plain text", () => {
    render(<><SourceLink name="KMD" url="https://meteo.go.ke/" /><SourceLink name="No link" /></>);
    expect(screen.getByRole("link", { name: "KMD" })).toHaveAttribute("target", "_blank");
    expect(screen.getByText("No link").tagName).toBe("SPAN");
  });
  it("guidance computed in the browser links to official advice", () => {
    const weather = { daily: Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-${10 + i}`, max: 25, min: 12, rain: i === 1 ? 40 : 0 })) };
    render(<Guidance weather={weather} />);
    expect(screen.getByText("Heavy rainfall")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /KMD/ }).length).toBeGreaterThan(0);
    expect(screen.getByText(/not a guarantee/)).toBeInTheDocument();
  });
  it("sources list shows an empty state, then real rows", async () => {
    api.sources.mockResolvedValueOnce([]);
    render(<SourcesList />);
    expect(await screen.findByText(/No calendar sources have been loaded yet/)).toBeInTheDocument();
    cleanup();
    api.sources.mockResolvedValueOnce([{ id: 1, organisation: "KALRO", title: "Kenya Crop Calendar", url: "https://example.org", licence: "CC BY 4.0", published_date: "2022-06-09", record_count: 4 }]);
    render(<SourcesList />);
    await waitFor(() => expect(screen.getByRole("link", { name: "Kenya Crop Calendar" })).toBeInTheDocument());
    expect(screen.getByText(/4 record/)).toBeInTheDocument();
  });
});
