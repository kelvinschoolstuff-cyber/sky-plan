"""The shipped KALRO/FAO records: import, honest county matching, startup auto-load, and a reproducible conversion."""
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.calendar_tools import county_listed, import_csv
from app.db import Base, CropCalendar, Source, get_db
from app.main import app

DATA = Path(__file__).resolve().parents[1] / "data"
REAL = DATA / "kalro_fao_kenya_calendar.csv"


def _engine():
    eng = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(eng)
    return eng


def _client(eng):
    def override():
        with Session(eng) as s:
            yield s
    app.dependency_overrides[get_db] = override
    return TestClient(app)


def test_real_file_imports_cleanly_with_full_provenance():
    eng = _engine()
    with Session(eng) as db:
        assert import_csv(str(REAL), db) == (202, [])
        src = db.scalars(select(Source)).one()
        assert src.licence == "CC BY 4.0" and "sproutopencontent.com/dataset/kenya-crop-calendar-fao" in src.url
        rows = db.scalars(select(CropCalendar)).all()
        assert all(r.county is None and r.agro_ecological_zone and r.administrative_areas for r in rows)   # zone-level, never a made-up county
        assert all(r.review_status == "draft" and "row" in r.source_page_or_sheet for r in rows)
        assert {r.crop for r in rows} == {"maize", "beans", "sorghum", "green_grams", "potatoes", "wheat", "tomato", "kale", "cabbage", "onion"}


def test_county_matching_uses_the_sources_own_spellings():
    assert county_listed("Trans Nzoia", "Rift valley province (Nandi, T/Nzoia, Uasin Gishu)")
    assert county_listed("West Pokot", "Rift valley (W/pokot, Baringo)")
    assert county_listed("Elgeyo-Marakwet", "Rift valley (Keiyo/Markwet)")
    assert county_listed("Murang'a", "Central province (Muranga, Kirinyaga)")
    assert county_listed("Uasin Gishu", "Riftvalley (UasinGishu, Nakuru)")
    assert not county_listed("Kisumu", "Nyanza province (Kisii)")          # a similar-looking name is not a match
    assert not county_listed("Nairobi", "Central province (Kiambu, Nyeri)")
    assert not county_listed("Nakuru", None)


def test_api_returns_zone_level_entries_for_a_listed_county_and_nothing_for_others():
    eng = _engine()
    with Session(eng) as db:
        import_csv(str(REAL), db)
    try:
        c = _client(eng)
        r = c.get("/calendar?crop=maize&county=Uasin Gishu").json()
        assert r["scope"] == "listed" and len(r["entries"]) > 0
        assert all("uasin" in e["administrative_areas"].lower() for e in r["entries"])
        assert all(e["county"] is None and e["agro_ecological_zone"] for e in r["entries"])
        assert len({e["agro_ecological_zone"] for e in r["entries"]}) > 1       # several zones: the farmer must choose theirs
        assert c.get("/calendar?crop=maize&county=Nairobi").json()["scope"] == "none"
        assert c.get("/sources").json()[0]["record_count"] == 202
    finally:
        app.dependency_overrides.clear()


def test_startup_loads_real_records_and_removes_leftover_sample_rows(monkeypatch):
    import app.main as main
    eng = _engine()
    with Session(eng) as db:
        import_csv(str(DATA / "calendar_sample.csv"), db, allow_sample=True)
        assert db.scalar(select(func.count(Source.id))) == 1
    monkeypatch.setattr(main, "engine", eng)
    main._load_default_calendar()
    main._load_default_calendar()                                              # second start must not duplicate
    with Session(eng) as db:
        assert db.scalar(select(func.count(CropCalendar.id))) == 202
        assert not any(s.organisation.upper().startswith("SAMPLE") for s in db.scalars(select(Source)))


def test_auto_load_can_be_switched_off(monkeypatch):
    import app.main as main
    eng = _engine()
    monkeypatch.setattr(main, "engine", eng)
    monkeypatch.setenv("AUTO_LOAD_CALENDAR", "0")
    main._load_default_calendar()
    with Session(eng) as db:
        assert db.scalar(select(func.count(CropCalendar.id))) == 0


def test_shipped_csv_is_exactly_what_the_converter_produces(tmp_path):
    pytest.importorskip("xlrd")
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
    from xls_to_calendar_csv import convert
    out = tmp_path / "again.csv"
    stats = convert(str(DATA / "source_files" / "kenya-crop-calendar-from-fao.xls"), str(out))
    assert out.read_text(encoding="utf-8") == REAL.read_text(encoding="utf-8")
    assert stats["skipped: crop not in AgriCast"] == 256


def test_every_value_in_the_shipped_csv_fits_its_database_column():
    """SQLite ignores VARCHAR limits but PostgreSQL does not: a 43-character zone name once broke the PostgreSQL import."""
    eng = _engine()
    with Session(eng) as db:
        import_csv(str(REAL), db)
        for model in (CropCalendar, Source):
            limits = {c.name: c.type.length for c in model.__table__.columns if getattr(c.type, "length", None)}
            for row in db.scalars(select(model)).all():
                for col, n in limits.items():
                    v = getattr(row, col)
                    assert v is None or len(str(v)) <= n, f"{model.__tablename__}.{col} is {len(str(v))} characters, limit {n}"
