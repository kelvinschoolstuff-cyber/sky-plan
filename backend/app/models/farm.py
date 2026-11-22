from datetime import datetime, timezone

from app.extensions import db

class Farm(db.Model):
    __tablename__ = "farms"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(150), nullable=False)
    county = db.Column(db.String(100), nullable=False)
    agroecological_zone = db.Column(db.String(120))

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    owner = db.relationship("User", back_populates="farms")

    planting_plans = db.relationship(
        "PlantingPlan",
        back_populates="farm",
        cascade="all, delete-orphan"
    )