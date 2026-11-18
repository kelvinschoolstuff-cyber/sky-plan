import os
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, create_engine, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://agricast:agricast@localhost:5432/agricast")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sms_alerts: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Farm(Base):
    __tablename__ = "farms"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    area_ha: Mapped[float | None] = mapped_column(Float, nullable=True)
    county: Mapped[str | None] = mapped_column(String(60), nullable=True)
    sub_county: Mapped[str | None] = mapped_column(String(80), nullable=True)
    agro_ecological_zone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    production_system: Mapped[str] = mapped_column(String(20), default="rain-fed")
    plantings: Mapped[list["Planting"]] = relationship(back_populates="farm", cascade="all, delete-orphan")


class Planting(Base):
    __tablename__ = "plantings"
    id: Mapped[int] = mapped_column(primary_key=True)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id", ondelete="CASCADE"), index=True)
    crop: Mapped[str] = mapped_column(String(40))
    planting_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="planned")  # planned / growing / harvested
    farm: Mapped[Farm] = relationship(back_populates="plantings")
    observations: Mapped[list["Observation"]] = relationship(cascade="all, delete-orphan")
    reminders: Mapped[list["Reminder"]] = relationship(cascade="all, delete-orphan")


class Observation(Base):
    __tablename__ = "observations"
    id: Mapped[int] = mapped_column(primary_key=True)
    planting_id: Mapped[int] = mapped_column(ForeignKey("plantings.id", ondelete="CASCADE"), index=True)
    observed_on: Mapped[date] = mapped_column(Date)
    growth_stage: Mapped[str | None] = mapped_column(String(60), nullable=True)
    rainfall_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class Reminder(Base):
    __tablename__ = "reminders"
    id: Mapped[int] = mapped_column(primary_key=True)
    planting_id: Mapped[int] = mapped_column(ForeignKey("plantings.id", ondelete="CASCADE"), index=True)
    due_date: Mapped[date] = mapped_column(Date)
    text: Mapped[str] = mapped_column(String(200))
    done: Mapped[bool] = mapped_column(Boolean, default=False)


class Source(Base):
    """Provenance for calendar records: who published it, where, when, under what licence."""
    __tablename__ = "sources"
    id: Mapped[int] = mapped_column(primary_key=True)
    organisation: Mapped[str] = mapped_column(String(200))
    title: Mapped[str] = mapped_column(String(300))
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_document: Mapped[str | None] = mapped_column(String(300), nullable=True)
    licence: Mapped[str | None] = mapped_column(String(100), nullable=True)
    published_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    accessed_date: Mapped[date | None] = mapped_column(Date, nullable=True)


class CropCalendar(Base):
    __tablename__ = "crop_calendars"
    id: Mapped[int] = mapped_column(primary_key=True)
    crop: Mapped[str] = mapped_column(String(40), index=True)
    county: Mapped[str | None] = mapped_column(String(60), nullable=True, index=True)  # None = broader region
    sub_county: Mapped[str | None] = mapped_column(String(80), nullable=True)
    agro_ecological_zone: Mapped[str | None] = mapped_column(String(80), nullable=True)
    administrative_areas: Mapped[str | None] = mapped_column(Text, nullable=True)  # the source's own area text (provinces/districts)
    season: Mapped[str | None] = mapped_column(String(60), nullable=True)
    production_system: Mapped[str] = mapped_column(String(20), default="rain-fed")  # rain-fed / irrigated / not stated
    planting_start: Mapped[str] = mapped_column(String(5))  # MM-DD
    planting_end: Mapped[str] = mapped_column(String(5))
    harvest_start: Mapped[str | None] = mapped_column(String(5), nullable=True)
    harvest_end: Mapped[str | None] = mapped_column(String(5), nullable=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"))
    source_page_or_sheet: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_wording: Mapped[str | None] = mapped_column(Text, nullable=True)  # original notation kept for audit
    reviewer_role: Mapped[str | None] = mapped_column(String(100), nullable=True)
    review_status: Mapped[str] = mapped_column(String(20), default="draft")
    last_reviewed_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[Source] = relationship()


def get_db():
    with SessionLocal() as db:
        yield db


UPGRADES = [
    "ALTER TABLE crop_calendars ADD COLUMN IF NOT EXISTS administrative_areas TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE farms ADD COLUMN IF NOT EXISTS county VARCHAR(60)",
    "ALTER TABLE farms ADD COLUMN IF NOT EXISTS sub_county VARCHAR(80)",
    "ALTER TABLE farms ADD COLUMN IF NOT EXISTS agro_ecological_zone VARCHAR(40)",
    "ALTER TABLE farms ADD COLUMN IF NOT EXISTS production_system VARCHAR(20) NOT NULL DEFAULT 'rain-fed'",
    "ALTER TABLE plantings ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'planned'",
    # widen after the ADD COLUMN steps above, so databases from version 1 (no such column yet) upgrade cleanly
    "ALTER TABLE crop_calendars ALTER COLUMN agro_ecological_zone TYPE VARCHAR(80)",
    "ALTER TABLE farms ALTER COLUMN agro_ecological_zone TYPE VARCHAR(80)",
]


def upgrade_schema(eng=engine):
    """Adds columns introduced after v1 so existing PostgreSQL data survives (create_all only adds new tables)."""
    if eng.dialect.name != "postgresql":
        return
    with eng.begin() as conn:
        for q in UPGRADES:
            conn.execute(text(q))
