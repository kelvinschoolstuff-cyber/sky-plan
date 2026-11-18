"""Validation, lookup and CSV import for source-attributed crop calendar records."""
import csv
import re
import sys
from datetime import date

from .counties import COUNTIES, names_for
from .crops import CROPS

MMDD = re.compile(r"^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$")
STATUSES = {"draft", "source-checked", "locally reviewed", "uncertain"}
SYSTEMS = {"rain-fed", "irrigated", "not stated"}
REQUIRED = ["crop", "source_organisation", "source_title", "source_page_or_sheet", "planting_start", "planting_end", "review_status"]


def validate_row(row: dict) -> list[str]:
    errs = [f"missing {k}" for k in REQUIRED if not (row.get(k) or "").strip()]
    if row.get("crop") and row["crop"] not in CROPS:
        errs.append(f"unknown crop '{row['crop']}'")
    if row.get("county") and row["county"] not in COUNTIES:
        errs.append(f"unknown county '{row['county']}' (leave blank if the source only covers a broader region)")
    for k in ("planting_start", "planting_end", "harvest_start", "harvest_end"):
        if row.get(k) and not MMDD.match(row[k]):
            errs.append(f"{k} must be MM-DD, got '{row[k]}'")
    if row.get("review_status") and row["review_status"] not in STATUSES:
        errs.append(f"review_status must be one of {sorted(STATUSES)}")
    if row.get("production_system") and row["production_system"] not in SYSTEMS:
        errs.append("production_system must be rain-fed, irrigated or not stated")
    return errs


def county_listed(county: str | None, areas: str | None) -> bool:
    """True when the source's own area text names this county (using the spellings the source uses)."""
    if not county or not areas:
        return False
    return any(re.search(r"(?<![A-Za-z])" + re.escape(n) + r"(?![A-Za-z])", areas, re.I) for n in names_for(county))


def select_entries(entries: list, county: str | None):
    """Never infer county dates. In order: records for exactly this county ("county"); records whose source area text names this
    county, which are zone-level ("listed"); records with no county and no area text, a broader region ("broader"); else nothing."""
    exact = [e for e in entries if county and e.county and e.county.lower() == county.lower()]
    if exact:
        return exact, "county"
    listed = [e for e in entries if county_listed(county, getattr(e, "administrative_areas", None))]
    if listed:
        return listed, "listed"
    broad = [e for e in entries if not e.county and not getattr(e, "administrative_areas", None)]
    return (broad, "broader") if broad else ([], "none")


def _t(s: str):
    return int(s[:2]), int(s[3:])


def in_window(start: str, end: str, d: date) -> bool:
    cur, s, e = (d.month, d.day), _t(start), _t(end)
    return s <= cur <= e if s <= e else (cur >= s or cur <= e)  # windows may wrap over New Year


def check_planting(entries, planting_date: date) -> dict:
    """Compare an actual planting date with calendar windows (indicative, never a verdict on the farmer's choice)."""
    if not entries:
        return dict(status="no_entry")
    hit = [e for e in entries if in_window(e.planting_start, e.planting_end, planting_date)]
    if hit:
        return dict(status="inside", season=hit[0].season)
    return dict(status="outside", windows=[dict(start=e.planting_start, end=e.planting_end, season=e.season) for e in entries])


def _d(v):
    return date.fromisoformat(v) if v else None


def import_csv(path: str, db, allow_sample: bool = False) -> tuple[int, list[str]]:
    from .db import CropCalendar, Source
    from sqlalchemy import select
    added, problems = 0, []
    with open(path, newline="", encoding="utf-8") as fh:
        rows = csv.DictReader(line for line in fh if not line.lstrip().startswith("#"))  # '#' lines are comments
        for n, row in enumerate(rows, start=2):
            row = {k: (v or "").strip() for k, v in row.items()}
            errs = validate_row(row)
            if errs:
                problems.append(f"row {n}: " + "; ".join(errs))
                continue
            if row["source_organisation"].upper().startswith("SAMPLE") and not allow_sample:
                problems.append(f"row {n}: SAMPLE test data skipped (pass --sample to import it into a test database)")
                continue
            key = dict(organisation=row["source_organisation"], title=row["source_title"], url=row.get("source_url") or None)
            src = db.scalar(select(Source).filter_by(**key))
            if not src:
                src = Source(**key, source_document=row.get("source_document") or None, licence=row.get("licence") or None,
                             published_date=_d(row.get("source_published_date")), accessed_date=_d(row.get("accessed_date")))
                db.add(src)
                db.flush()
            vals = dict(
                crop=row["crop"], county=row.get("county") or None, sub_county=row.get("sub_county") or None,
                agro_ecological_zone=row.get("agro_ecological_zone") or None, season=row.get("season") or None,
                administrative_areas=row.get("administrative_areas") or None,
                production_system=row.get("production_system") or "rain-fed",
                planting_start=row["planting_start"], planting_end=row["planting_end"],
                harvest_start=row.get("harvest_start") or None, harvest_end=row.get("harvest_end") or None,
                source_id=src.id, source_page_or_sheet=row["source_page_or_sheet"], source_wording=row.get("source_wording") or None,
                reviewer_role=row.get("reviewer_role") or None, review_status=row["review_status"],
                last_reviewed_at=_d(row.get("last_reviewed_at")), notes=row.get("notes") or None)
            ident = ("crop", "county", "season", "agro_ecological_zone", "production_system", "source_id")
            old = db.scalar(select(CropCalendar).filter_by(**{k: vals[k] for k in ident}))
            if old:  # same record re-imported (for example after expert review): update and bump the version
                for k, v in vals.items():
                    setattr(old, k, v)
                old.version += 1
            else:
                db.add(CropCalendar(**vals))
            added += 1
    db.commit()
    return added, problems


if __name__ == "__main__":  # python -m app.calendar_tools file.csv [--sample]
    from .db import Base, SessionLocal, engine
    Base.metadata.create_all(engine)
    with SessionLocal() as s:
        args = [a for a in sys.argv[1:] if not a.startswith("--")]
        n, errs = import_csv(args[0], s, allow_sample="--sample" in sys.argv)
    print(f"Imported {n} records.")
    for e in errs:
        print("SKIPPED", e)
