from datetime import datetime, timezone

from app.extensions import db

class PlantingPlan(db.Model):
    __tablename__ = "planting_plans"

    id = db.Column(db.Integer, primary_key=True)

    crop_id = db.Column(
        db.Integer,
        db.ForeignKey
        ("crops.id",
          name="fk_planting_plans_crop_id_crops"    
        ),
        nullable=False
    )

    
    season = db.Column(db.String(100), nullable=False)

    planting_date = db.Column(db.Date, nullable=False)
    expected_harvest_date = db.Column(db.Date, nullable=False)

    acreage = db.Column(db.Float, nullable=False)


    status = db.Column(
        db.String(30),
        nullable=False,
        default="planted"
    )

    notes = db.Column(db.Text)

    farm_id = db.Column(
        db.Integer,
        db.ForeignKey("farms.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    farm = db.relationship("Farm", back_populates="planting_plans")

    crop = db.relationship(
        "Crop",
        back_populates="planting_plans"
    )