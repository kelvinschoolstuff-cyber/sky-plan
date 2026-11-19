"""Convert the KALRO/FAO "Kenya Crop Calendar from FAO" spreadsheet into AgriCast's calendar import CSV.

    pip install xlrd pandas
    python scripts/xls_to_calendar_csv.py data/source_files/kenya-crop-calendar-from-fao.xls data/kalro_fao_kenya_calendar.csv

Nothing is inferred. Dates are only reformatted (DD/MM -> MM-DD). The source describes agro-ecological zones and lists old provinces and
districts in text, so the county column is left blank and the source's own area text goes in administrative_areas.
Only crops that exist in AgriCast are converted; the rest are counted and reported.
"""
import csv
import re
import sys
from collections import Counter

import pandas as pd

# source crop name -> AgriCast crop key. Mungbean is the same species as green gram (Vigna radiata); checked against the scientific name below.
CROP_MAP = {"Maize": "maize", "Bean common, dry": "beans", "Sorghum": "sorghum", "Mungbean": "green_grams", "Potato": "potatoes",
            "Wheat, common": "wheat", "Tomato": "tomato", "Kale": "kale", "Cabbage, common": "cabbage", "Onion": "onion"}
EXPECT_SCIENTIFIC = {"Mungbean": "radiata", "Potato": "tuberosum", "Maize": "Zea mays"}

SOURCE = dict(
    source_organisation="KALRO (data compiled by FAO), via the Sprout Open Content Agriculture Platform",
    source_title="Kenya Crop Calendar from FAO",
    source_url="https://staging.sproutopencontent.com/dataset/kenya-crop-calendar-fao",
    source_document="kenya-crop-calendar-from-fao.xls (file properties: created 2021-04-21, last saved 2021-10-04; Sprout listing updated 2022-06-09)",
    source_published_date="2022-06-09", accessed_date="2026-11-17", licence="CC BY 4.0",
)
COLS = ["crop", "county", "sub_county", "agro_ecological_zone", "season", "production_system", "planting_start", "planting_end",
        "harvest_start", "harvest_end", "administrative_areas", "source_organisation", "source_title", "source_url", "source_document",
        "source_page_or_sheet", "source_published_date", "accessed_date", "licence", "source_wording", "reviewer_role", "review_status",
        "last_reviewed_at", "notes"]


def mmdd(v: str) -> str:
    d, m = v.strip().split("/")
    return f"{m}-{d}"


def clean(v) -> str:
    return re.sub(r"\s+", " ", str(v)).strip() if pd.notna(v) else ""


def convert(src: str, dst: str) -> Counter:
    df = pd.read_excel(src, engine="xlrd")
    df.columns = [c.strip() for c in df.columns]
    stats, rows, seen = Counter(), [], Counter()
    total = Counter((CROP_MAP[clean(r["Crop"])], clean(r["Agro-ecological zones"]), clean(r["Additional Information"]).capitalize())
                    for _, r in df.iterrows() if clean(r["Crop"]) in CROP_MAP)
    for i, r in df.iterrows():
        name = clean(r["Crop"])
        if name not in CROP_MAP:
            stats["skipped: crop not in AgriCast"] += 1
            continue
        want = EXPECT_SCIENTIFIC.get(name)
        if want and want not in clean(r["Scientific name"]):
            raise SystemExit(f"Row {i + 2}: unexpected scientific name {clean(r['Scientific name'])!r} for {name}")
        zone, season = clean(r["Agro-ecological zones"]), clean(r["Additional Information"]).capitalize()
        key = (CROP_MAP[name], zone, season)
        seen[key] += 1
        n = f" ({seen[key]})" if total[key] > 1 else ""   # numbering only when the same crop, zone and season repeats
        season = (season or "Season not stated") + n
        wording = (f"Source row {i + 2}. Crop: {name}. Zone: {zone}. Season: {clean(r['Additional Information']) or 'not stated'}. "
                   f"Planting {clean(r['Planting period - onset'])} to {clean(r['Planting period - end'])} (DD/MM). "
                   f"Harvest {clean(r['Harvesting period - onset'])} to {clean(r['Harvesting period - end'])} (DD/MM). "
                   f"Cropping cycle: {clean(r['Length of the cropping cycle']) or 'not stated'}. "
                   f"Zone practices: {clean(r['Agricultural practices']) or 'not stated'}.")
        rows.append(dict(
            crop=CROP_MAP[name], county="", sub_county="", agro_ecological_zone=zone, season=season,
            production_system="not stated", planting_start=mmdd(r["Planting period - onset"]), planting_end=mmdd(r["Planting period - end"]),
            harvest_start=mmdd(r["Harvesting period - onset"]), harvest_end=mmdd(r["Harvesting period - end"]),
            administrative_areas=clean(r["Administrative areas"]), source_page_or_sheet=f"First Sheet, row {i + 2}", source_wording=wording,
            reviewer_role="", review_status="draft", last_reviewed_at="",
            notes="Imported as published; not yet cross-checked against a second source or reviewed locally. "
                  "The source does not say whether this entry is rain-fed or irrigated.", **SOURCE))
        stats[f"converted: {CROP_MAP[name]}"] += 1
    with open(dst, "w", newline="", encoding="utf-8") as fh:
        fh.write("# Converted from the KALRO/FAO Kenya Crop Calendar spreadsheet by scripts/xls_to_calendar_csv.py. Dates are MM-DD.\n")
        fh.write("# County is blank on purpose: the source is organised by agro-ecological zone and lists old provinces/districts in administrative_areas.\n")
        w = csv.DictWriter(fh, fieldnames=COLS)
        w.writeheader()
        w.writerows(rows)
    return stats


if __name__ == "__main__":
    s = convert(sys.argv[1], sys.argv[2])
    print(f"Wrote {sum(v for k, v in s.items() if k.startswith('converted'))} rows to {sys.argv[2]}")
    for k, v in sorted(s.items()):
        print(f"  {k}: {v}")
