const kalroMaize = {
  name: "KALRO Good Agricultural Practices: Maize Management Practices",
  url: "https://kalrogaps.info/chain/1/practices",
  publicationDate: null,
};

const kalroCropHub = {
  name: "KALRO Good Agricultural Practices Hub",
  url: "https://kalrogaps.info/",
  publicationDate: null,
};

const digitalAgriculturePlatform = {
  name: "KALRO Kenya Digital Agriculture Platform",
  url: "https://keep.kalro.org/",
  publicationDate: null,
};

const notVerified = "Unavailable: a crop-specific value was not verified from an accessible source.";

export const cropData = [
  {
    id: "maize",
    name: "Maize",
    growingDuration: notVerified,
    suitableTemperature: notVerified,
    rainfallRequirements: notVerified,
    soilRequirements: "KALRO describes well-drained, well-aerated, deep soils with adequate organic matter and nutrients as best for maize.",
    waterRequirements: "KALRO describes maize as rain-fed, with irrigation if needed; it mentions efficient micro-irrigation such as drip.",
    managementPractices: [
      "Plant at the onset of rains when the soil is moist; the KALRO page gives an example of four continuous days of sufficient rain.",
      "Plant along contours or across the slope, and conduct a germination test before planting.",
      "If irrigation is needed, KALRO recommends efficient methods such as drip and watering outside full sunshine.",
    ],
    sources: [kalroMaize],
    verificationStatus: "Qualitative soil, planting, and water facts verified; numeric crop requirements unavailable.",
  },
  {
    id: "beans",
    name: "Beans",
    growingDuration: notVerified,
    suitableTemperature: notVerified,
    rainfallRequirements: notVerified,
    soilRequirements: notVerified,
    waterRequirements: notVerified,
    managementPractices: [],
    sources: [kalroCropHub, digitalAgriculturePlatform],
    verificationStatus: "Crop-specific facts require follow-up in the KALRO GAP beans entry; no figures are supplied here.",
  },
  {
    id: "sorghum",
    name: "Sorghum",
    growingDuration: notVerified,
    suitableTemperature: notVerified,
    rainfallRequirements: notVerified,
    soilRequirements: notVerified,
    waterRequirements: notVerified,
    managementPractices: [],
    sources: [kalroCropHub, digitalAgriculturePlatform],
    verificationStatus: "Crop-specific facts require follow-up in the KALRO GAP sorghum entry; no figures are supplied here.",
  },
  {
    id: "green-grams",
    name: "Green grams",
    growingDuration: notVerified,
    suitableTemperature: notVerified,
    rainfallRequirements: notVerified,
    soilRequirements: notVerified,
    waterRequirements: notVerified,
    managementPractices: [],
    sources: [kalroCropHub, digitalAgriculturePlatform],
    verificationStatus: "Crop-specific facts require follow-up in KALRO resources; no figures are supplied here.",
  },
  {
    id: "irish-potatoes",
    name: "Irish potatoes",
    growingDuration: notVerified,
    suitableTemperature: notVerified,
    rainfallRequirements: notVerified,
    soilRequirements: notVerified,
    waterRequirements: notVerified,
    managementPractices: [],
    sources: [kalroCropHub, digitalAgriculturePlatform],
    verificationStatus: "Crop-specific facts require follow-up in the KALRO GAP potato entry; no figures are supplied here.",
  },
];
