import time
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import httpx

DAILY = "temperature_2m_max,temperature_2m_min,precipitation_sum"
_cache: dict = {}


async def _get(url: str, params: dict, ttl: int):
    key = (url, tuple(sorted(params.items())))
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < ttl:
        return hit[1]
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    _cache[key] = (time.time(), data)
    return data


def _rows(j):
    d = j["daily"]
    return [(date.fromisoformat(t), hi, lo, p or 0.0)
            for t, hi, lo, p in zip(d["time"], d["temperature_2m_max"], d["temperature_2m_min"], d["precipitation_sum"])
            if hi is not None and lo is not None]


async def forecast(lat, lon, past_days=0):
    """Returns (rows, timezone, local_today). rows = (date, tmax, tmin, precip)."""
    j = await _get("https://api.open-meteo.com/v1/forecast",
                   dict(latitude=lat, longitude=lon, daily=DAILY, forecast_days=16,
                        past_days=past_days, timezone="auto"), 1800)
    tz = j.get("timezone", "UTC")
    return _rows(j), tz, datetime.now(ZoneInfo(tz)).date()


async def series(lat, lon, start: date):
    """Daily weather from `start` to 15 days ahead: archive for older days, forecast for recent and future."""
    rows, tz, today = await forecast(lat, lon, past_days=7)
    merged = {r[0]: r for r in rows}
    gap_end = min(rows[0][0] - timedelta(days=1), today)
    if start <= gap_end:
        j = await _get("https://archive-api.open-meteo.com/v1/archive",
                       dict(latitude=lat, longitude=lon, start_date=start.isoformat(),
                            end_date=gap_end.isoformat(), daily=DAILY, timezone="auto"), 86400)
        for r in _rows(j):
            merged.setdefault(r[0], r)
    return [merged[d] for d in sorted(merged) if d >= start], tz, today


async def precip_history(lat, lon, start: date, end: date) -> dict:
    j = await _get("https://archive-api.open-meteo.com/v1/archive",
                   dict(latitude=lat, longitude=lon, start_date=start.isoformat(), end_date=end.isoformat(),
                        daily="precipitation_sum", timezone="auto"), 7 * 86400)
    d = j["daily"]
    return {date.fromisoformat(t): p for t, p in zip(d["time"], d["precipitation_sum"]) if p is not None}


async def water_balance_rows(lat, lon):
    j = await _get("https://api.open-meteo.com/v1/forecast",
                   dict(latitude=lat, longitude=lon, daily="precipitation_sum,et0_fao_evapotranspiration",
                        forecast_days=7, timezone="auto"), 1800)
    d = j["daily"]
    return list(zip(d["time"], d["precipitation_sum"], d["et0_fao_evapotranspiration"]))


async def full_forecast(lat, lon):
    """Current conditions, next 24 hours and 7 days in one response, so the frontend talks to AgriCast's API only."""
    j = await _get("https://api.open-meteo.com/v1/forecast",
                   dict(latitude=lat, longitude=lon, timezone="auto", forecast_days=7, forecast_hours=24,
                        current="temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
                        hourly="temperature_2m,precipitation_probability,precipitation,weather_code",
                        daily="temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,"
                              "wind_speed_10m_max,weather_code"), 600)
    d, h = j["daily"], j["hourly"]
    return {
        "source": "Open-Meteo", "timezone": j.get("timezone"), "current": j.get("current"),
        "hourly": [dict(time=t, temp=h["temperature_2m"][i], prob=h["precipitation_probability"][i],
                        rain=h["precipitation"][i], code=h["weather_code"][i]) for i, t in enumerate(h["time"])],
        "from": d["time"][0], "to": d["time"][-1],
        "daily": [dict(date=t, max=d["temperature_2m_max"][i], min=d["temperature_2m_min"][i], rain=d["precipitation_sum"][i],
                       prob=d["precipitation_probability_max"][i], wind=d["wind_speed_10m_max"][i], code=d["weather_code"][i])
                  for i, t in enumerate(d["time"])],
    }


async def geocode(name: str, count: int = 5):
    """Place search through the backend, so it works wherever the weather works."""
    j = await _get("https://geocoding-api.open-meteo.com/v1/search", dict(name=name, count=count), 86400)
    return [dict(name=", ".join(x for x in (p.get("name"), p.get("admin1"), p.get("country")) if x),
                 lat=p["latitude"], lon=p["longitude"]) for p in j.get("results", [])]
