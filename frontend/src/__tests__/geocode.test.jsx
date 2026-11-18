import { describe, it, expect, vi, beforeEach } from "vitest";
import { geocode } from "../weather";

const RESULT = { name: "Eldoret, Uasin Gishu, Kenya", lat: 0.52, lon: 35.27 };
const json = (data) => ({ ok: true, json: async () => data });
beforeEach(() => vi.restoreAllMocks());

describe("place search", () => {
  it("goes through the AgriCast API first", async () => {
    const f = vi.fn(async () => json([RESULT])); vi.stubGlobal("fetch", f);
    expect(await geocode("eldoret")).toEqual([RESULT]);
    expect(String(f.mock.calls[0][0])).toContain("localhost:8000/geocode?q=eldoret");
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("falls back to Open-Meteo when the API is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (String(url).includes("localhost:8000")) throw new TypeError("refused");
      return json({ results: [{ name: "Eldoret", admin1: "Uasin Gishu", country: "Kenya", latitude: 0.52, longitude: 35.27 }] });
    }));
    expect(await geocode("eldoret")).toEqual([RESULT]);
  });
  it("shows an error when nothing can be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    await expect(geocode("eldoret")).rejects.toThrow();
  });
});
