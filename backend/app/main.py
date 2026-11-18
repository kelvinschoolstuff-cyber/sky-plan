import os
from contextlib import asynccontextmanager
from datetime import date

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
from datetime import date as _date
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import weather
from .advice import DISCLAIMER, advise
from .calendar_tools import SYSTEMS, check_planting, select_entries
from .climate import SEASONS, find_onset, longest_dry_run, summarise_onsets
import re
from sqlalchemy.orm import object_session
from .counties import COUNTIES
from .auth import check_pw, current_user, hash_pw, make_token
from .crops import CROPS, crop_or_404
from .db import Base, upgrade_schema, CropCalendar, Source, Farm, Observation, Planting, Reminder, User, engine, get_db
from .gdd import accumulate, daily_gdd, harvest_window, stage_for


DATA_DIR = __import__("pathlib").Path(__file__).resolve().parents[1] / "data"


def _load_default_calendar():
    """Import the shipped KALRO/FAO records when no REAL calendar records exist yet (and drop leftover SAMPLE rows).
    Set AUTO_LOAD_CALENDAR=0 to start with an empty calendar."""
    from .calendar_tools import import_csv
    path = DATA_DIR / "kalro_fao_kenya_calendar.csv"
    if os.getenv("AUTO_LOAD_CALENDAR", "1") != "1" or not path.exists():
        return
    with Session(engine) as s:
        real = s.scalar(select(func.count(CropCalendar.id)).join(Source, Source.id == CropCalendar.source_id)
                        .where(~Source.organisation.like("SAMPLE%")))
        if real:
            return
        for src in s.scalars(select(Source).where(Source.organisation.like("SAMPLE%"))).all():
            s.query(CropCalendar).filter(CropCalendar.source_id == src.id).delete()
            s.delete(src)
        s.commit()
        n, problems = import_csv(str(path), s)
        print(f"Loaded {n} KALRO/FAO calendar records (status: draft). Problems: {len(problems)}")


def _load_demo_calendar():
    """DEMO_SAMPLE_CALENDAR=1 loads SAMPLE placeholder rows when the calendar is still empty. Never for real use."""
    from .calendar_tools import import_csv
    with Session(engine) as s:
        if s.scalar(select(func.count(CropCalendar.id))) == 0:
            n, _ = import_csv(str(DATA_DIR / "calendar_sample.csv"), s, allow_sample=True)
            print(f"DEMO MODE: loaded {n} SAMPLE calendar rows (placeholder dates, NOT real data)")


@asynccontextmanager
async def lifespan(_):
    Base.metadata.create_all(engine)
    upgrade_schema()
    _load_default_calendar()
    if os.getenv("DEMO_SAMPLE_CALENDAR") == "1":
        _load_demo_calendar()
    yield


app = FastAPI(title="AgriCast API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
                   allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",  # any local dev address/port
                   allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(httpx.HTTPError)
async def weather_down(_: Request, __):
    return JSONResponse({"detail": "Weather service is unavailable. Try again shortly."}, status_code=502)


class Register(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=72)


class Login(BaseModel):
    email: str
    password: str


class FarmIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    area_ha: float | None = Field(default=None, gt=0)
    county: str | None = None
    sub_county: str | None = Field(default=None, max_length=80)
    agro_ecological_zone: str | None = Field(default=None, max_length=80)
    production_system: str = "rain-fed"


class PlantingIn(BaseModel):
    crop: str
    planting_date: date
    status: str = "planned"


class StatusIn(BaseModel):
    status: str


class MeIn(BaseModel):
    phone: str | None = None
    sms_alerts: bool = False


class ReminderIn(BaseModel):
    due_date: date
    text: str = Field(min_length=1, max_length=200)


class ObsIn(BaseModel):
    observed_on: date
    growth_stage: str | None = Field(default=None, max_length=60)
    rainfall_mm: float | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=2000)


STATUS = {"planned", "growing", "harvested"}


def own_farm(db: Session, user: User, fid: int) -> Farm:
    farm = db.get(Farm, fid)
    if not farm or farm.user_id != user.id:
        raise HTTPException(404, "Farm not found")
    return farm


def own_planting(db: Session, user: User, pid: int) -> Planting:
    p = db.get(Planting, pid)
    if not p or p.farm.user_id != user.id:
        raise HTTPException(404, "Planting not found")
    return p


def farm_out(f: Farm) -> dict:
    return dict(id=f.id, name=f.name, latitude=f.latitude, longitude=f.longitude, area_ha=f.area_ha, county=f.county,
                sub_county=f.sub_county, agro_ecological_zone=f.agro_ecological_zone, production_system=f.production_system,
                plantings=[dict(id=p.id, crop=p.crop, crop_name=CROPS[p.crop]["name"], planting_date=p.planting_date, status=p.status)
                           for p in f.plantings])


# ---- public ----
@app.get("/crops")
def crops():
    return [dict(key=k, **v) for k, v in CROPS.items()]


@app.get("/counties")
def counties():
    return COUNTIES


@app.get("/calendar")
def calendar(crop: str, county: str | None = None, db: Session = Depends(get_db)):
    """Source-attributed planting/harvest windows. Never infers a county's dates from a broader record."""
    crop_or_404(crop)
    entries = db.scalars(select(CropCalendar).where(CropCalendar.crop == crop)).all()
    chosen, scope = select_entries(entries, county)
    return dict(crop=crop, county=county, scope=scope, entries=[dict(
        id=e.id, county=e.county, sub_county=e.sub_county, agro_ecological_zone=e.agro_ecological_zone,
        administrative_areas=e.administrative_areas, season=e.season,
        production_system=e.production_system, planting_start=e.planting_start, planting_end=e.planting_end,
        harvest_start=e.harvest_start, harvest_end=e.harvest_end, source_page_or_sheet=e.source_page_or_sheet,
        source_wording=e.source_wording, review_status=e.review_status, reviewer_role=e.reviewer_role,
        last_reviewed_at=e.last_reviewed_at, version=e.version, notes=e.notes,
        source=dict(organisation=e.source.organisation, title=e.source.title, url=e.source.url, licence=e.source.licence,
                    published_date=e.source.published_date, accessed_date=e.source.accessed_date)) for e in chosen])


@app.get("/geocode")
async def geocode_endpoint(q: str):
    if len(q.strip()) < 2 or len(q) > 80:
        raise HTTPException(422, "Type at least 2 letters of a place name")
    return await weather.geocode(q.strip())


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/weather")
async def weather_now(lat: float, lon: float):
    """Forecast for the dashboard, fetched and cached by the backend (frontend falls back to Open-Meteo if this is unreachable)."""
    return await weather.full_forecast(lat, lon)


@app.get("/sources")
def sources(db: Session = Depends(get_db)):
    """Every source behind the calendar records, with how many records cite it (for transparency in the app)."""
    rows = db.execute(select(Source, func.count(CropCalendar.id)).outerjoin(CropCalendar, CropCalendar.source_id == Source.id)
                      .group_by(Source.id).order_by(Source.id)).all()
    return [dict(id=s.id, organisation=s.organisation, title=s.title, url=s.url, licence=s.licence,
                 published_date=s.published_date, accessed_date=s.accessed_date, record_count=n) for s, n in rows]


@app.get("/advice")
async def advice(crop: str, lat: float, lon: float):
    c = crop_or_404(crop)
    rows, tz, today = await weather.forecast(lat, lon)
    return dict(crop=crop, timezone=tz, today=today, forecast_from=rows[0][0] if rows else None,
                forecast_to=rows[min(6, len(rows) - 1)][0] if rows else None, disclaimer=DISCLAIMER,
                items=advise(c, rows, today))


# ---- auth ----
@app.post("/auth/register", status_code=201)
def register(body: Register, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    if "@" not in email:
        raise HTTPException(422, "Enter a valid email address")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "An account with this email already exists")
    user = User(email=email, name=body.name.strip(), password_hash=hash_pw(body.password))
    db.add(user)
    db.commit()
    return dict(token=make_token(user.id), name=user.name)


@app.post("/auth/login")
def login(body: Login, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user or not check_pw(body.password, user.password_hash):
        raise HTTPException(401, "Wrong email or password")
    return dict(token=make_token(user.id), name=user.name)


# ---- farms and plantings ----
@app.get("/farms")
def list_farms(user: User = Depends(current_user), db: Session = Depends(get_db)):
    farms = db.scalars(select(Farm).where(Farm.user_id == user.id).order_by(Farm.id)).all()
    return [farm_out(f) for f in farms]


@app.post("/farms", status_code=201)
def create_farm(body: FarmIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.county and body.county not in COUNTIES:
        raise HTTPException(422, "Choose a county from the list")
    if body.production_system not in SYSTEMS:
        raise HTTPException(422, "Production system must be rain-fed or irrigated")
    farm = Farm(user_id=user.id, **body.model_dump())
    db.add(farm)
    db.commit()
    return farm_out(farm)


@app.delete("/farms/{fid}", status_code=204)
def delete_farm(fid: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(own_farm(db, user, fid))
    db.commit()


@app.post("/farms/{fid}/plantings", status_code=201)
def create_planting(fid: int, body: PlantingIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    farm = own_farm(db, user, fid)
    crop_or_404(body.crop)
    if body.status not in STATUS:
        raise HTTPException(422, "Status must be planned, growing or harvested")
    p = Planting(farm_id=farm.id, crop=body.crop, planting_date=body.planting_date, status=body.status)
    db.add(p)
    db.commit()
    return dict(id=p.id, crop=p.crop, planting_date=p.planting_date)


async def planting_progress(p: Planting) -> dict:
    crop, farm = CROPS[p.crop], p.farm
    rows, tz, today = await weather.series(farm.latitude, farm.longitude, p.planting_date)
    past = [(d, hi, lo) for d, hi, lo, _ in rows if d <= today]
    curve = accumulate(past, crop)
    acc = curve[-1][1] if curve else 0.0
    recent = [daily_gdd(hi, lo, crop["base"], crop["upper"]) for _, hi, lo in past[-14:]]
    rate = sum(recent) / len(recent) if recent else 0.0
    ahead = [daily_gdd(hi, lo, crop["base"], crop["upper"]) for d, hi, lo, _ in rows if d > today]
    early, late = harvest_window(acc, crop["gdd"], ahead, rate, today)
    pct = min(100, round(acc / crop["gdd"] * 100))
    entries = object_session(p).scalars(select(CropCalendar).where(CropCalendar.crop == p.crop)).all()
    chosen, scope = select_entries(entries, farm.county)
    window = dict(check_planting(chosen, p.planting_date), scope=scope)
    return dict(planting_id=p.id, window_check=window, crop=crop["name"], planting_date=p.planting_date, today=today, timezone=tz,
                accumulated_gdd=acc, target_gdd=crop["gdd"], percent=pct, stage=stage_for(acc, crop["gdd"]),
                harvest_earliest=early, harvest_latest=late,
                basis=("Indicative growth tracker. It uses the 16-day forecast, then the average of the last 14 days, so it "
                       "cannot predict seasons ahead. Crop GDD targets are approximate and not yet reviewed."),
                guidance=advise(crop, [r for r in rows if r[0] >= today], today, pct),
                curve=[dict(date=d, gdd=g) for d, g in curve])


@app.get("/plantings/{pid}/progress")
async def progress(pid: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return await planting_progress(own_planting(db, user, pid))


@app.patch("/plantings/{pid}")
def set_status(pid: int, body: StatusIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.status not in STATUS:
        raise HTTPException(422, "Status must be planned, growing or harvested")
    own_planting(db, user, pid).status = body.status
    db.commit()
    return dict(status=body.status)


# ---- reminders and alerts ----
@app.get("/plantings/{pid}/reminders")
def list_reminders(pid: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    own_planting(db, user, pid)
    rows = db.scalars(select(Reminder).where(Reminder.planting_id == pid).order_by(Reminder.done, Reminder.due_date)).all()
    return [dict(id=r.id, due_date=r.due_date, text=r.text, done=r.done) for r in rows]


@app.post("/plantings/{pid}/reminders", status_code=201)
def add_reminder(pid: int, body: ReminderIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    own_planting(db, user, pid)
    r = Reminder(planting_id=pid, **body.model_dump())
    db.add(r)
    db.commit()
    return dict(id=r.id)


@app.patch("/reminders/{rid}")
def toggle_reminder(rid: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    r = db.get(Reminder, rid)
    if not r or r.planting.farm.user_id != user.id:
        raise HTTPException(404, "Reminder not found")
    r.done = not r.done
    db.commit()
    return dict(done=r.done)


async def build_alerts(user: User, db: Session) -> list:
    """In-app alerts: due reminders plus warning-level forecast guidance for active plantings."""
    farms = db.scalars(select(Farm).where(Farm.user_id == user.id)).all()
    active = [p for f in farms for p in f.plantings if p.status != "harvested"]
    results = await asyncio.gather(*(planting_progress(p) for p in active), return_exceptions=True)
    out = []
    for p, res in zip(active, results):
        label = f"{CROPS[p.crop]['name']} at {p.farm.name}"
        for r in p.reminders:
            if not r.done and r.due_date <= _date.today():
                out.append(dict(kind="reminder", level="warn", farm_crop=label, message=r.text))
        if not isinstance(res, Exception):
            out += [dict(kind="forecast", level=g["level"], farm_crop=label, message=f"{g['situation']}: {g['message']}")
                    for g in res["guidance"] if g["level"] == "warn"]
    return out


@app.get("/alerts")
async def alerts(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return await build_alerts(user, db)


@app.get("/me")
def me(user: User = Depends(current_user)):
    return dict(name=user.name, email=user.email, phone=user.phone, sms_alerts=user.sms_alerts)


@app.patch("/me")
def update_me(body: MeIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    phone = (body.phone or "").replace(" ", "") or None
    if phone and not re.fullmatch(r"\+\d{10,15}", phone):
        raise HTTPException(422, "Enter the phone number with country code, for example +2547XXXXXXXX")
    if body.sms_alerts and not phone:
        raise HTTPException(422, "Add a phone number to receive SMS alerts")
    user.phone, user.sms_alerts = phone, body.sms_alerts
    db.commit()
    return dict(phone=user.phone, sms_alerts=user.sms_alerts)


# ---- local climate insights (public) ----
@app.get("/climate/onset")
async def onset(lat: float, lon: float, season: str = "long", years: int = 10):
    """Historical rainfall onset at this location from modelled rainfall, using a simplified definition."""
    if season not in SEASONS or not 3 <= years <= 20:
        raise HTTPException(422, "season must be long or short; years 3 to 20")
    last = _date.today().year - 1
    rain = await weather.precip_history(lat, lon, _date(last - years + 1, 1, 1), _date.today())
    m, d = SEASONS[season]
    onsets = {y: find_onset(rain, _date(y, m, d)) for y in range(last - years + 1, last + 1)}
    return dict(season=season, definition="First day with at least 20 mm in 3 days, with no run of 10 dry days (under 1 mm) in the next 30 days.",
                source="Open-Meteo historical (reanalysis) rainfall. Modelled, not a rain-gauge record.",
                note="Indicative local context, not a forecast and not an official KMD onset product.", **summarise_onsets(onsets))


@app.get("/water-balance")
async def water_balance(lat: float, lon: float):
    rows = await weather.water_balance_rows(lat, lon)
    days, cum = [], 0.0
    for t, p, e in rows:
        p, e = p or 0.0, e or 0.0
        cum += p - e
        days.append(dict(date=t, rain=round(p, 1), et0=round(e, 1), balance=round(p - e, 1), cumulative=round(cum, 1)))
    rain, et0 = sum(x["rain"] for x in days), sum(x["et0"] for x in days)
    dry = longest_dry_run([x["rain"] for x in days])
    return dict(days=days, rain_total=round(rain, 1), et0_total=round(et0, 1), longest_dry_run=dry,
                summary=(f"Next 7 days: about {rain:.0f} mm of rain against {et0:.0f} mm of reference evapotranspiration "
                         f"(water a well-watered grass surface could lose). The longest forecast dry run is {dry} day(s)."),
                note="Reference evapotranspiration is not your crop's exact water use, and soil, slope and crop stage matter. "
                     "Use it as a rough guide alongside local advice.")


# ---- observations ----
@app.get("/plantings/{pid}/observations")
def list_obs(pid: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    own_planting(db, user, pid)
    rows = db.scalars(select(Observation).where(Observation.planting_id == pid)
                      .order_by(Observation.observed_on.desc(), Observation.id.desc())).all()
    return [dict(id=o.id, observed_on=o.observed_on, growth_stage=o.growth_stage,
                 rainfall_mm=o.rainfall_mm, notes=o.notes) for o in rows]


@app.post("/plantings/{pid}/observations", status_code=201)
def add_obs(pid: int, body: ObsIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    own_planting(db, user, pid)
    o = Observation(planting_id=pid, **body.model_dump())
    db.add(o)
    db.commit()
    return dict(id=o.id)


@app.get("/plantings/{pid}/rain-check")
async def rain_check(pid: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Compare rainfall the farmer recorded with modelled rainfall for the same days (a personal forecast-data check)."""
    p = own_planting(db, user, pid)
    obs = [o for o in p.observations if o.rainfall_mm is not None and o.observed_on <= _date.today()]
    if not obs:
        return dict(pairs=[], mean_abs_diff=None)
    rows, _, _ = await weather.series(p.farm.latitude, p.farm.longitude, min(o.observed_on for o in obs))
    model = {d: pr for d, _, _, pr in rows}
    pairs = [dict(date=o.observed_on, observed=o.rainfall_mm, modelled=round(model[o.observed_on], 1),
                  difference=round(o.rainfall_mm - model[o.observed_on], 1))
             for o in sorted(obs, key=lambda o: o.observed_on) if o.observed_on in model][-30:]
    mad = round(sum(abs(x["difference"]) for x in pairs) / len(pairs), 1) if pairs else None
    return dict(pairs=pairs, mean_abs_diff=mad,
                note="Modelled rainfall is a grid estimate and may differ from a rain gauge at your exact field.")
