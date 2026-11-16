const kmdAgromet = {
  name: "Kenya Meteorological Department: Agrometeorology",
  url: "https://meteo.go.ke/Services/agrometeorology/",
};

const kmdWarnings = {
  name: "Kenya Meteorological Department: Weather Warnings",
  url: "https://meteo.go.ke/weather-warnings/",
};

const faoKenyaBrief = {
  name: "FAO GIEWS Kenya Country Brief (4 May 2026)",
  url: "https://www.fao.org/giews/countrybrief/country.jsp?code=KEN",
};

const kalroGap = {
  name: "KALRO Good Agricultural Practices Hub",
  url: "https://kalrogaps.info/",
};

export const guidanceData = [
  {
    id: "expected-rainfall",
    title: "Rain is expected",
    condition: "When your forecast shows rainfall",
    guidance:
      "Check the latest county forecast and agrometeorological bulletin for rainfall timing and distribution. Confirm that your field soil is ready before planting; a rain forecast alone does not confirm field conditions.",
    sources: [kmdAgromet, faoKenyaBrief],
  },
  {
    id: "dry-conditions",
    title: "Dry conditions",
    condition: "When little or no rain is forecast",
    guidance:
      "Compare the forecast with soil moisture in your field and seek local extension advice before changing planting or irrigation plans. KMD bulletins include rainfall and soil-moisture information for agricultural planning.",
    sources: [kmdAgromet, kalroGap],
  },
  {
    id: "heavy-rainfall",
    title: "Heavy rainfall",
    condition: "When a heavy-rain alert applies to your area",
    guidance:
      "Read the current KMD warning and follow its safety instructions. FAO reports that excessive rain can cause waterlogging and crop stress in poorly drained areas; check drainage only when it is safe to do so.",
    sources: [kmdWarnings, faoKenyaBrief],
  },
  {
    id: "high-temperatures",
    title: "High temperatures",
    condition: "When forecast temperatures are unusually high for your crop and area",
    guidance:
      "Use the local KMD agrometeorological bulletin and crop-specific KALRO advice together. This app does not set a universal heat threshold or prescribe irrigation amounts.",
    sources: [kmdAgromet, kalroGap],
  },
];

export const guidanceDisclaimer =
  "This is general weather-planning information, not a crop-specific recommendation. Forecasts can change; consult current county advisories and a local agricultural extension expert.";
