
export const plantingCalendarData = [
  
  {
    id: 1,
    crop: "Maize",
    county: null,
    agroEcologicalZone: "National (High/Medium Rainfall Areas)",
    season: "Long Rains (MAM)",
    plantingStart: "March",
    plantingEnd: "April",
    harvestStart: "October",
    harvestEnd: "November",
    productionSystem: "Rain-fed",
    source: "FAO GIEWS Country Brief (Kenya) - Jun 2025",
    sourceUrl: "https://cb.apps.fao.org/country.jsp?code=KEN",
    sourceDate: "2025-06-18",
    verificationStatus: "Source-checked (National)",
    notes: "Main season cereal crops planted in March/April and harvested from October. Verify with local KMD agromet bulletin for specific county timing."
  },

  {
    id: 2,
    crop: "Maize",
    county: null,
    agroEcologicalZone: "National (High/Medium Rainfall Areas)",
    season: "Short Rains (OND)",
    plantingStart: "October",
    plantingEnd: "November",
    harvestStart: "February",
    harvestEnd: "March",
    productionSystem: "Rain-fed",
    source: "KMD Seasonal Forecast (OND)",
    sourceUrl: "https://meteo.go.ke/",
    sourceDate: "2025-09-15",
    verificationStatus: "Source-checked (Seasonal Outlook)",
    notes: "Short rains maize. Timing varies significantly by county. Check the KMD 10-day bulletin."
  },

  
  {
    id: 3,
    crop: "Beans",
    county: null,
    agroEcologicalZone: "National (High/Medium Rainfall Areas)",
    season: "Long Rains (MAM)",
    plantingStart: "March",
    plantingEnd: "April",
    harvestStart: "July",
    harvestEnd: "August",
    productionSystem: "Rain-fed",
    source: "FAO GIEWS Country Brief (Kenya)",
    sourceUrl: "https://cb.apps.fao.org/country.jsp?code=KEN",
    sourceDate: "2025-06-18",
    verificationStatus: "Source-checked (National)",
    notes: "Plant at onset of reliable rains. Harvest when pods turn yellow/brown."
  },

  {
    id: 4,
    crop: "Beans",
    county: null,
    agroEcologicalZone: "National (High/Medium Rainfall Areas)",
    season: "Short Rains (OND)",
    plantingStart: null,
    plantingEnd: null,
    harvestStart: null,
    harvestEnd: null,
    productionSystem: "Rain-fed",
    source: "KALRO Crop Calendar (PDF - accessed via Sprout)",
    sourceUrl: "https://staging.sproutopencontent.com/dataset/kenya-crop-calendar-kalro",
    sourceDate: "2022-06-09",
    verificationStatus: "Unavailable (Data extraction pending)",
    notes: "Specific short rains dates for beans are listed in the KALRO PDF. Manual verification required."
  },

  
  {
    id: 5,
    crop: "Sorghum",
    county: null,
    agroEcologicalZone: "Semi-Arid Areas",
    season: "Long Rains (MAM)",
    plantingStart: null,
    plantingEnd: null,
    harvestStart: null,
    harvestEnd: null,
    productionSystem: "Rain-fed",
    source: "KALRO Crop Calendar (PDF - accessed via Sprout)",
    sourceUrl: "https://staging.sproutopencontent.com/dataset/kenya-crop-calendar-kalro",
    sourceDate: "2022-06-09",
    verificationStatus: "Unavailable (Data extraction pending)",
    notes: "Specific dates are listed in the KALRO PDF, but could not be extracted automatically. Please manually check the source document."
  },

  
  {
    id: 6,
    crop: "Green Grams",
    county: null,
    agroEcologicalZone: "Semi-Arid Areas",
    season: "Short Rains (OND)",
    plantingStart: null,
    plantingEnd: null,
    harvestStart: null,
    harvestEnd: null,
    productionSystem: "Rain-fed",
    source: "KALRO Crop Calendar (PDF - accessed via Sprout)",
    sourceUrl: "https://staging.sproutopencontent.com/dataset/kenya-crop-calendar-kalro",
    sourceDate: "2022-06-09",
    verificationStatus: "Unavailable (Data extraction pending)",
    notes: "Short maturity (60-75 days). Check KALRO PDF for specific regional dates."
  },

  
  {
    id: 7,
    crop: "Irish Potatoes",
    county: null,
    agroEcologicalZone: "Highlands (Cooler Areas)",
    season: "Long Rains (MAM)",
    plantingStart: null,
    plantingEnd: null,
    harvestStart: null,
    harvestEnd: null,
    productionSystem: "Rain-fed",
    source: "KALRO Crop Calendar (PDF - accessed via Sprout)",
    sourceUrl: "https://staging.sproutopencontent.com/dataset/kenya-crop-calendar-kalro",
    sourceDate: "2022-06-09",
    verificationStatus: "Unavailable (Data extraction pending)",
    notes: "Requires cooler highland areas. Check KALRO PDF for specific planting windows."
  }
];