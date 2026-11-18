DISCLAIMER = ("General information based on the next 7 days of forecast. It is not a guarantee, it does not replace "
              "advice from your county extension officer, and screening thresholds are rough, not agronomic rules.")
BASIS = "AgriCast general guidance (not yet reviewed by an agronomist)"
# Where to check OFFICIAL local advice. These links are pointers, not the origin of AgriCast's thresholds.
AGROMET = ("KMD Agrometeorology", "https://meteo.go.ke/Services/agrometeorology/")
BULLETIN = ("KMD Monthly Agrometeorological Bulletin", "https://meteo.go.ke/our-products/monthly-agrometeorological-bulletin/")
SOURCE_FOR = {"Heavy rainfall": BULLETIN, "Harvest period approaching with rain forecast": BULLETIN}


def advise(crop: dict, rows, today, percent: int | None = None):
    """Qualified, general guidance from a 7-day forecast. rows: (date, tmax, tmin, precip)."""
    nxt = [r for r in rows if r[0] >= today][:7]
    if not nxt:
        return []
    rain = sum(r[3] for r in nxt)
    out = []

    def add(situation, level, message):
        name, url = SOURCE_FOR.get(situation, AGROMET)
        out.append(dict(situation=situation, level=level, message=message, basis=BASIS, source_name=name, source_url=url))

    if rain >= 20:
        add("Rainfall expected", "info", f"About {rain:.0f} mm of rain is forecast over the next 7 days. Review land preparation and "
            "planting plans against the crop calendar for your county.")
    elif rain < 5:
        add("Little rain forecast", "info", f"Only {rain:.0f} mm is forecast over the next 7 days. This is a short-term view, not a "
            "season outlook. Monitor soil moisture and consider locally recommended water-conservation practices.")
    for r in nxt:
        d = r[0].strftime("%a %d %b")
        if r[3] >= 30:
            add("Heavy rainfall", "warn", f"{r[3]:.0f} mm is forecast on {d}. Consider drainage, erosion prevention and waterlogging risks.")
        if r[1] >= crop["upper"] + 3:
            add("High temperatures", "warn", f"A high of {r[1]:.0f}°C is forecast on {d}. Monitor crops for heat stress and follow "
                "locally appropriate water-management guidance.")
        if r[2] <= 2:
            add("Cold night", "warn", f"A low of {r[2]:.0f}°C is forecast on {d}. Check whether young plants need protection.")
    if percent is not None and percent >= 90 and rain >= 20:
        add("Harvest period approaching with rain forecast", "warn",
            "Crop growth looks close to maturity and rain is forecast. Review crop maturity and harvesting plans to reduce weather-related losses.")
    return out
