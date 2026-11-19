from fastapi.testclient import TestClient

from app.crops import CROPS, NOTES_STATUS
from app.main import app


def test_crop_keys_are_safe_for_urls_and_csv():
    assert all(k == k.lower() and " " not in k for k in CROPS)


def test_draft_notes_exist_only_for_the_five_supplied_crops_and_are_flagged():
    noted = {k for k, c in CROPS.items() if "soil_requirements" in c}
    assert noted == {"maize", "beans", "sorghum", "green_grams", "potatoes"}
    assert all(CROPS[k]["notes_status"] == NOTES_STATUS and CROPS[k]["management_practices"] for k in noted)


def test_api_returns_the_notes_with_the_draft_flag():
    maize = next(c for c in TestClient(app).get("/crops").json() if c["key"] == "maize")
    assert "pH 5.5" in maize["soil_requirements"] and "not yet verified" in maize["notes_status"]


def test_cors_allows_any_local_dev_origin_but_not_strangers():
    c = TestClient(app)
    ask = lambda origin: c.options("/crops", headers={"Origin": origin, "Access-Control-Request-Method": "GET"})
    for origin in ("http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"):
        r = ask(origin)
        assert r.status_code == 200 and r.headers["access-control-allow-origin"] == origin
    assert ask("https://evil.example.com").status_code == 400
