from app.extensions import db

class Crop(db.Model):
    __tablename__ = "crops"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(
        db.String(100),
        unique=True,
        nullable=False

    )

    description = db.Column(db.Text)

    growing_duration = db.Column(db.Integer) #planting to maturity

    suitable_temperature = db.Column(db.String(150))
    rainfall_requirements = db.Column(db.String(150))
    soil_requirements = db.Column(db.Text)
    water_requirements = db.Column(db.Text)
    management_practices = db.Column(db.Text)

    planting_plans = db.relationship(
        "PlantingPlan",
        back_populates="crop"
    )

    crop_calendars = db.relationship(
        "CropCalendar",
        back_populates="crop"
    )

    def __repr__(self):
        return f"<Crop {self.name}>"