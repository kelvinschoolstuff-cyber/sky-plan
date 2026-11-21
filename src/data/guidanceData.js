const kmdAgrometeorology = {
  name: "Kenya Meteorological Department (KMD) Agrometeorology",
  url: "https://meteo.go.ke/Services/agrometeorology/",
};

const faoSoilCover = {
  name: "FAO Conservation Agriculture: Soil Organic Cover",
  url: "https://www.fao.org/conservation-agriculture/in-practice/soil-organic-cover/en/",
};

const kmdFloodBulletin = {
  name: "Kenya Meteorological Department (KMD) Flood Bulletin",
  url: "https://meteo.go.ke/our-products/flood-bulletin/",
};

const faoWaterManagement = {
  name: "FAO Agricultural Water Management",
  url: "https://www.fao.org/land-water/water/agricultural-water-management/en/",
};

export const guidanceData = [
  {
    id: "expected-rainfall",
    title: "Rain expected",
    advice:
      "Use local forecasts to plan field work and planting. Check soil moisture before adding irrigation.",
    source: kmdAgrometeorology,
  },
  {
    id: "dry-conditions",
    title: "Mostly dry conditions",
    advice:
      "Keep suitable crop residues or other organic cover on the soil to help reduce moisture loss.",
    source: faoSoilCover,
  },
  {
    id: "heavy-rainfall",
    title: "Heavy rainfall possible",
    advice:
      "Check local KMD flood updates, protect people and equipment, and avoid entering flooded areas.",
    source: kmdFloodBulletin,
  },
  {
    id: "high-temperature",
    title: "High temperatures",
    advice:
      "Monitor crop and soil moisture, and follow locally recommended water-management practices.",
    source: faoWaterManagement,
  },
];

export const guidanceThresholds = {
  dryDailyRainfallMm: 1,
  heavyDailyRainfallMm: 20,
  highTemperatureC: 30,
};