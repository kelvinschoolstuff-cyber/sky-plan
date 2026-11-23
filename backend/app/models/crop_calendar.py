from app.extensions import db

class CropCalendar(db.Model):
    __tablename__ = "crop_calendars"

    id = db.Column(db.Integer, primary_key=True)

    crop_id = db.Column(
        db.Integer,
        db.ForeignKey("crops.id"),
        nullable=False
    )

    county = db.Column(db.String(100))
    subcounty = db.Column(db.String(100))
    agroecological_zone = db.Column(db.String(120))

    season = db.Column(db.String(100))
    production_system = db.Column(db.String(100))

    planting_window = db.Column(db.String(100))
    harvest_window = db.Column(db.String(100))

    source_id = db.Column(
        db.Integer,
        db.ForeignKey("sources.id"),
        nullable=False
    )

    source_reference = db.Column(db.String(200))

    verification_status = db.Column(
        db.String(30),
        nullable=False,
        default="unverified"
    )

    reviewed_at = db.Column(db.DateTime(timezone=True))

    notes = db.Column(db.Text)

    crop = db.relationship(
        "Crop",
        back_populates="crop_calendars"
    )

    source = db.relationship(
        "Source",
        back_populates="crop_calendars"
    )

    def __repr__(self):
        return f"<Cropcalendar {self.crop_id} - {self.county}>"