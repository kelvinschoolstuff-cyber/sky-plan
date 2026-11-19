import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../api", () => ({ api: { calendar: vi.fn() }, flushQueue: vi.fn(), pending: () => 0 }));
import { api } from "../api";
import PlantingCalendar from "../components/PlantingCalendar";

const SOURCE = { organisation: "KALRO (data compiled by FAO), via Sprout", title: "Kenya Crop Calendar from FAO", url: "https://example.org/k", licence: "CC BY 4.0", published_date: "2022-06-09", accessed_date: "2026-11-17" };
const entry = (id, zone) => ({ id, county: null, sub_county: null, agro_ecological_zone: zone, administrative_areas: "Rift valley province (Nandi, Uasin Gishu)",
  season: "First season", production_system: "not stated", planting_start: "03-15", planting_end: "04-30", harvest_start: "09-01", harvest_end: "12-20",
  source_page_or_sheet: `First Sheet, row ${id}`, source_wording: "Source row. Cycle 150-180 days.", review_status: "draft", reviewer_role: null,
  last_reviewed_at: null, version: 1, notes: null, source: SOURCE });
beforeEach(() => { cleanup(); vi.resetAllMocks(); api.calendar.mockResolvedValue({ scope: "listed", entries: [entry(1, "Lower midland zone 3 (LM3)"), entry(2, "Upper midland zone 2 (UM2)")] }); });

describe("zone-level calendar (KALRO/FAO data)", () => {
  it("explains that the source works by zone and shows the areas it names", async () => {
    render(<PlantingCalendar crop="maize" county="Uasin Gishu" />);
    expect(await screen.findByText(/does not give dates by county/)).toBeInTheDocument();
    expect(screen.getAllByText(/Rift valley province \(Nandi, Uasin Gishu\)/).length).toBe(2);
    expect(screen.getAllByText(/Lower midland zone 3/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Kenya Crop Calendar from FAO" }).length).toBe(2);
    expect(screen.getAllByText("15 Mar to 30 Apr").length).toBe(2);
  });
  it("lets the farmer narrow to their own zone", async () => {
    render(<PlantingCalendar crop="maize" county="Uasin Gishu" />);
    fireEvent.change(await screen.findByLabelText(/Your agro-ecological zone/), { target: { value: "Upper midland zone 2 (UM2)" } });
    await waitFor(() => expect(screen.queryByText(/First Sheet, row 1\)/)).toBeNull());
    expect(screen.getByText(/First Sheet, row 2\)/)).toBeInTheDocument();
  });
  it("pre-selects the farm's own zone when it matches one of the listed zones", async () => {
    render(<PlantingCalendar crop="maize" county="Uasin Gishu" zone="um2" />);
    expect(await screen.findByText(/First Sheet, row 2\)/)).toBeInTheDocument();
    expect(screen.queryByText(/First Sheet, row 1\)/)).toBeNull();
  });
  it("still shows a county-specific record by county name", async () => {
    api.calendar.mockResolvedValue({ scope: "county", entries: [{ ...entry(3, null), county: "Nakuru", administrative_areas: null }] });
    render(<PlantingCalendar crop="maize" county="Nakuru" />);
    expect(await screen.findByText("Nakuru")).toBeInTheDocument();
    expect(screen.queryByText(/does not give dates by county/)).toBeNull();
  });
});
