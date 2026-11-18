from datetime import date

from app.advice import advise
from app.crops import CROPS
from app.gdd import accumulate, daily_gdd, harvest_window, project, stage_for


def test_daily_gdd_basic():
    assert daily_gdd(30, 10, 10, 30) == 10


def test_daily_gdd_caps_tmax():
    assert daily_gdd(40, 15, 10, 30) == 12.5


def test_cold_day_is_zero():
    assert daily_gdd(8, 2, 10, 30) == 0


def test_accumulate():
    days = [(date(2026, 1, 1), 30, 10), (date(2026, 1, 2), 30, 10)]
    assert accumulate(days, CROPS["maize"])[-1][1] == 20


def test_project_uses_forecast_then_rate():
    assert project(25, [10, 10], 5, date(2026, 1, 1)) == date(2026, 1, 4)


def test_stages():
    assert stage_for(0, 100) == "Emergence"
    assert stage_for(95, 100) == "Maturity"


def test_harvest_reached():
    today = date(2026, 1, 1)
    assert harvest_window(2300, 2200, [], 5, today) == (today, today)


def test_harvest_range_is_ordered():
    early, late = harvest_window(1000, 2200, [8] * 5, 10, date(2026, 1, 1))
    assert early < late


def test_frost_warning():
    rows = [(date(2026, 1, 1 + i), 20, 1 if i == 2 else 12, 0) for i in range(7)]
    items = advise(CROPS["maize"], rows, date(2026, 1, 1))
    assert any(i["situation"] == "Cold night" for i in items)


from app.advice import DISCLAIMER, advise as _advise
from app.calendar_tools import select_entries, validate_row
from types import SimpleNamespace as NS

GOOD = dict(crop="maize", county="Nakuru", source_organisation="KALRO", source_title="Crop cycle calendar",
            source_page_or_sheet="p.3", planting_start="03-15", planting_end="04-30", review_status="draft")


def test_valid_calendar_row():
    assert validate_row(GOOD) == []


def test_row_without_source_is_rejected():
    bad = {**GOOD, "source_title": "", "planting_start": "15 March", "review_status": "ok"}
    errs = " ".join(validate_row(bad))
    assert "source_title" in errs and "MM-DD" in errs and "review_status" in errs


def test_unknown_county_rejected():
    assert any("county" in e for e in validate_row({**GOOD, "county": "Atlantis"}))


def test_lookup_never_infers_county_from_other_county():
    entries = [NS(county="Kisumu"), NS(county=None)]
    chosen, scope = select_entries(entries, "Nakuru")
    assert scope == "broader" and chosen == [entries[1]]
    assert select_entries([NS(county="Kisumu")], "Nakuru") == ([], "none")
    assert select_entries(entries, "kisumu")[1] == "county"


def test_guidance_is_qualified_not_definitive():
    rows = [(date(2026, 1, 1 + i), 24, 12, 35 if i == 1 else 0) for i in range(7)]
    items = _advise(CROPS["maize"], rows, date(2026, 1, 1))
    assert any(i["situation"] == "Heavy rainfall" for i in items)
    assert all("Water today" not in i["message"] and i["basis"] for i in items)
    assert "not a guarantee" in DISCLAIMER


def test_harvest_with_rain_guidance():
    rows = [(date(2026, 1, 1 + i), 24, 12, 5) for i in range(7)]
    items = _advise(CROPS["maize"], rows, date(2026, 1, 1), percent=95)
    assert any(i["situation"].startswith("Harvest period") for i in items)


def test_reimport_updates_and_bumps_version(tmp_path):
    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session
    from app.calendar_tools import import_csv
    from app.db import Base, CropCalendar
    eng = create_engine("sqlite://")
    Base.metadata.create_all(eng)
    head = "crop,county,season,planting_start,planting_end,source_organisation,source_title,source_page_or_sheet,review_status\n"
    f = tmp_path / "c.csv"
    f.write_text(head + "maize,Nakuru,Long rains,03-15,04-30,KALRO,Crop cycle,p3,draft\n")
    with Session(eng) as db:
        assert import_csv(str(f), db) == (1, [])
        f.write_text(head + "maize,Nakuru,Long rains,03-20,04-30,KALRO,Crop cycle,p3,source-checked\n")
        import_csv(str(f), db)
        rows = db.scalars(select(CropCalendar)).all()
        assert len(rows) == 1 and rows[0].version == 2 and rows[0].planting_start == "03-20"


from app.calendar_tools import check_planting, in_window
from app.climate import find_onset, longest_dry_run, summarise_onsets
from datetime import timedelta


def test_onset_found_and_dry_spell_rejected():
    start = date(2020, 2, 15)
    rain = {start + timedelta(days=i): 0.0 for i in range(150)}
    rain[date(2020, 3, 10)] = 25.0                      # trigger, then dry for 10+ days
    assert find_onset(rain, start) is None
    for i in range(1, 40, 5):                           # light rain every 5 days breaks the dry runs
        rain[date(2020, 3, 10) + timedelta(days=i)] = 3.0
    assert find_onset(rain, start) == date(2020, 3, 8)  # window of 3 days starting 8 Mar includes the 25 mm


def test_dry_run_and_summary():
    assert longest_dry_run([0, 0, 5, 0, 0, 0, 2]) == 3
    s = summarise_onsets({2020: date(2020, 3, 10), 2021: date(2021, 3, 20), 2022: None})
    assert s["found"] == 2 and s["total"] == 3 and s["earliest"] == "10 Mar"


def test_window_check_including_new_year_wrap():
    assert in_window("10-15", "01-15", date(2026, 12, 20)) and in_window("10-15", "01-15", date(2026, 1, 5))
    assert not in_window("03-01", "04-30", date(2026, 6, 1))
    e = [NS(planting_start="03-01", planting_end="04-30", season="Long rains")]
    assert check_planting(e, date(2026, 3, 15))["status"] == "inside"
    assert check_planting(e, date(2026, 7, 1))["status"] == "outside"
    assert check_planting([], date(2026, 7, 1))["status"] == "no_entry"


# ---------- v4: sources, sample fixture, official-source links ----------
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine as _ce
from sqlalchemy.orm import Session as _S
from sqlalchemy.pool import StaticPool

DATA = Path(__file__).resolve().parents[1] / "data"


def _db():
    from app.db import Base
    eng = _ce("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(eng)
    return eng


def test_template_has_no_data_rows_and_comments_are_skipped():
    from app.calendar_tools import import_csv
    eng = _db()
    with _S(eng) as db:
        assert import_csv(str(DATA / "calendar_template.csv"), db) == (0, [])


def test_sample_fixture_is_blocked_unless_flagged():
    from app.calendar_tools import import_csv
    eng = _db()
    with _S(eng) as db:
        n, problems = import_csv(str(DATA / "calendar_sample.csv"), db)
        assert n == 0 and len(problems) == 10 and "SAMPLE" in problems[0]
        assert import_csv(str(DATA / "calendar_sample.csv"), db, allow_sample=True) == (10, [])


def test_sources_and_calendar_endpoints_with_sample_data():
    from app.calendar_tools import import_csv
    from app.db import get_db
    from app.main import app
    eng = _db()
    with _S(eng) as db:
        import_csv(str(DATA / "calendar_sample.csv"), db, allow_sample=True)

    def override():
        with _S(eng) as s:
            yield s

    app.dependency_overrides[get_db] = override
    try:
        c = TestClient(app)
        src = c.get("/sources").json()
        assert len(src) == 1 and src[0]["record_count"] == 10 and src[0]["organisation"].startswith("SAMPLE")
        assert c.get("/calendar?crop=maize&county=Nakuru").json()["scope"] == "county"
        assert c.get("/calendar?crop=maize&county=Kisumu").json()["scope"] == "none"   # never borrow another county's dates
        assert c.get("/calendar?crop=beans&county=Kisumu").json()["scope"] == "broader"
        crops = c.get("/crops").json()
        assert all(x["source_url"].startswith("https://") and x["reference_url"].startswith("https://") for x in crops)
    finally:
        app.dependency_overrides.clear()


def test_advice_items_link_to_official_sources():
    rows = [(date(2026, 1, 1 + i), 24, 12, 35 if i == 1 else 0) for i in range(7)]
    items = _advise(CROPS["maize"], rows, date(2026, 1, 1))
    heavy = next(i for i in items if i["situation"] == "Heavy rainfall")
    assert heavy["source_url"].startswith("https://meteo.go.ke/") and heavy["source_name"]
    assert all(i["source_url"] and i["basis"] for i in items)
