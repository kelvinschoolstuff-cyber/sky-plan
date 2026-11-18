import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import CropInformation from "../components/CropInformation";
import { FALLBACK_CROPS } from "../data/fallbackData";

afterEach(cleanup);
const crop = (key) => FALLBACK_CROPS.find((c) => c.key === key);

describe("crop information", () => {
  it("shows the growing notes with a clear draft warning", () => {
    render(<CropInformation crop={crop("maize")} />);
    expect(screen.getByText(/team draft and have not been checked against a source/)).toBeInTheDocument();
    expect(screen.getByText(/Deep, well-drained loamy soils/)).toBeInTheDocument();
    expect(screen.getByText("90–120 days")).toBeInTheDocument();
    expect(screen.getByText("not yet reviewed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FAO Crop Calendar" })).toHaveAttribute("href", "https://cropcalendar.apps.fao.org/");
  });
  it("says so plainly when a crop has no notes, instead of leaving gaps", () => {
    render(<CropInformation crop={crop("wheat")} />);
    expect(screen.getByText("No growing notes for this crop yet.")).toBeInTheDocument();
    expect(screen.queryByText(/team draft/)).toBeNull();
  });
  it("uses keys that match the backend (no spaces)", () => {
    expect(FALLBACK_CROPS.map((c) => c.key)).toContain("green_grams");
    expect(FALLBACK_CROPS.every((c) => !c.key.includes(" "))).toBe(true);
  });
});
