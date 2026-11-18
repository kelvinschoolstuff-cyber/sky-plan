import asyncio

from fastapi.testclient import TestClient

from app import weather
from app.main import app

FAKE = {"timezone": "Africa/Nairobi", "current": {"temperature_2m": 22, "weather_code": 1},
        "hourly": {"time": ["2026-11-13T10:00", "2026-11-13T11:00"], "temperature_2m": [22, 23], "precipitation_probability": [10, None],
                   "precipitation": [0, 0.2], "weather_code": [1, 3]},
        "daily": {"time": ["2026-11-13", "2026-11-14"], "temperature_2m_max": [27, 28], "temperature_2m_min": [14, 15],
                  "precipitation_sum": [0, 5], "precipitation_probability_max": [10, 60], "wind_speed_10m_max": [12, 14],
                  "weather_code": [1, 61]}}


def _patch(monkeypatch):
    async def fake(url, params, ttl):
        assert params["forecast_hours"] == 24 and "precipitation_probability_max" in params["daily"]
        return FAKE
    monkeypatch.setattr(weather, "_get", fake)


def test_full_forecast_shape(monkeypatch):
    _patch(monkeypatch)
    out = asyncio.run(weather.full_forecast(-0.5, 35.3))
    assert out["from"] == "2026-11-13" and out["to"] == "2026-11-14"
    assert out["daily"][1]["prob"] == 60 and out["hourly"][1]["prob"] is None and out["source"] == "Open-Meteo"


def test_weather_endpoint_serves_the_frontend_shape(monkeypatch):
    _patch(monkeypatch)
    r = TestClient(app).get("/weather?lat=-0.5&lon=35.3")
    assert r.status_code == 200 and {"current", "hourly", "daily", "from", "to"} <= set(r.json())


def test_health():
    assert TestClient(app).get("/health").json() == {"status": "ok"}


def test_geocode_endpoint(monkeypatch):
    async def fake(url, params, ttl):
        assert params["name"] == "eldoret"
        return {"results": [{"name": "Eldoret", "admin1": "Uasin Gishu", "country": "Kenya", "latitude": 0.52, "longitude": 35.27}]}
    monkeypatch.setattr(weather, "_get", fake)
    c = TestClient(app)
    assert c.get("/geocode?q=eldoret").json() == [{"name": "Eldoret, Uasin Gishu, Kenya", "lat": 0.52, "lon": 35.27}]
    assert c.get("/geocode?q=a").status_code == 422
