"""Reference parameters used by the growth tracker and general guidance.
These are APPROXIMATE general values, not sourced calendar data: review before real use.
Planting/harvest calendars live in the database with full source provenance."""
from fastapi import HTTPException

# URLs say WHERE to verify the values. The numbers below are approximate and have NOT been confirmed from these pages yet.
FAO_CALENDAR = "https://cropcalendar.apps.fao.org/"
KALRO_CROP_CYCLE = "https://staging.sproutopencontent.com/dataset/kenya-crop-calendar-kalro"

def _c(name, group, priority, base, upper, gdd, min_plant_temp, depth, spacing, water):
    return dict(name=name, group=group, priority=priority, base=base, upper=upper, gdd=gdd,
                min_plant_temp=min_plant_temp, depth_cm=depth, spacing=spacing, water=water, reviewed=False,
                source_url=FAO_CALENDAR, reference_url=KALRO_CROP_CYCLE)

CROPS = {
    "maize":        _c("Maize", "Cereals", "core", 10, 30, 2200, 12, "5", "75 x 25 cm", "500-800 mm per season"),
    "beans":        _c("Beans", "Legumes", "core", 10, 30, 1200, 15, "3-5", "50 x 10 cm", "300-500 mm per season"),
    "sorghum":      _c("Sorghum", "Cereals", "additional", 8, 35, 2000, 15, "3-5", "75 x 15 cm", "300-600 mm per season"),
    "green_grams":  _c("Green grams", "Legumes", "additional", 10, 35, 1300, 18, "3-4", "50 x 10 cm", "250-400 mm per season"),
    "potatoes":     _c("Irish potatoes", "Tubers", "additional", 7, 30, 1600, 8, "10", "75 x 30 cm", "500-700 mm per season"),
    "wheat":        _c("Wheat", "Cereals", "later", 0, 25, 2000, 5, "3-4", "20 cm rows", "450-650 mm per season"),
    "tomato":       _c("Tomato", "Vegetables", "later", 10, 30, 1400, 15, "1", "60 x 45 cm", "400-600 mm per season"),
    "kale":         _c("Kale", "Vegetables", "later", 4, 28, 900, 7, "1-2", "45 x 45 cm", "300-500 mm per season"),
    "cabbage":      _c("Cabbage", "Vegetables", "later", 4, 28, 1100, 7, "1-2", "50 x 50 cm", "350-500 mm per season"),
    "onion":        _c("Onion", "Vegetables", "later", 5, 30, 1500, 8, "1", "30 x 10 cm", "350-550 mm per season"),
}

# Draft growing notes supplied by the team. NOT verified against any source yet, so the app shows them with a clear "draft" flag.
# Keys match the crop keys above. Crops without notes simply show "No growing notes for this crop yet."
NOTES_STATUS = "draft, not yet verified against a source"
_NOTES = {
    "maize": dict(growing_duration="90–120 days", suitable_temperature="18°C – 32°C", rainfall_requirements="500 – 800 mm per season",
                  soil_requirements="Deep, well-drained loamy soils. pH 5.5 – 7.0.", water_requirements="High water demand. Susceptible to waterlogging.",
                  management_practices="Plant at the onset of rains. Apply DAP at planting. Weed regularly."),
    "beans": dict(growing_duration="70–90 days", suitable_temperature="17°C – 27°C", rainfall_requirements="300 – 400 mm per season",
                  soil_requirements="Well-drained loamy soils. pH 5.5 – 6.5.", water_requirements="Moderate. Critical during flowering.",
                  management_practices="Inoculate seeds with rhizobium. Control aphids early."),
    "sorghum": dict(growing_duration="100–130 days", suitable_temperature="25°C – 35°C", rainfall_requirements="400 – 600 mm per season",
                    soil_requirements="Adapts to a wide range of soils. Tolerates salinity.", water_requirements="Low. Very drought-resistant.",
                    management_practices="Plant in dry areas or after short rains. Watch out for birds."),
    "green_grams": dict(growing_duration="60–75 days", suitable_temperature="20°C – 35°C", rainfall_requirements="300 – 400 mm per season",
                        soil_requirements="Well-drained sandy or loamy soils. pH 6.0 – 7.0.", water_requirements="Low. Extremely sensitive to waterlogging.",
                        management_practices="Plant at the start of short rains. Spray for thrips."),
    "potatoes": dict(growing_duration="90–120 days", suitable_temperature="15°C – 25°C", rainfall_requirements="500 – 700 mm per season",
                     soil_requirements="Deep, loose, well-drained volcanic or loamy soils. pH 4.5 – 6.5.", water_requirements="Moderate. Tubers rot in waterlogged soil.",
                     management_practices="Plant certified seed potatoes. Earth up twice. Spray for late blight."),
}
for _key, _n in _NOTES.items():
    CROPS[_key].update(_n, notes_status=NOTES_STATUS)


def crop_or_404(key: str) -> dict:
    if key not in CROPS:
        raise HTTPException(404, f"Unknown crop '{key}'")
    return CROPS[key]
