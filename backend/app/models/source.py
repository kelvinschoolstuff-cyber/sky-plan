from app.extensions import db

class Source(db.Model):
    __tablename__ = "sources"

    id = db.Column(db.Integer, primary_key=True)

    organisation = db.Column(db.String(150), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500))

    licence = db.Column(db.String(150))

    published_date = db.Column(db.Date)
    accessed_date = db.Column(db.Date)

    notes = db.Column(db.Text)

    crop_calendars = db.relationship(
        "CropCalendar",
        back_populates="source"
    )

    def __repr__(self):
        return f"<Source {self.title}>"