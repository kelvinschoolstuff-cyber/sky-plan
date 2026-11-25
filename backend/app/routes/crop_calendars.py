from flask import Blueprint, request
from sqlalchemy import func
from app.extensions import db
from app.models import CropCalendar, Source
from app.serializers import crop_calendar_to_dict, source_to_dict
from app.utils import error_response, login_required, parse_positive_int, validation_error

crop_calendars_bp = Blueprint("crop_calendars", __name__, url_prefix="/api")

EXACT_FILTERS = {
    "county": CropCalendar.county,
    "sub_county": CropCalendar.sub_county,
    "season": CropCalendar.season,
}


@crop_calendars_bp.route("/crop-calendars", methods=["GET"])
@login_required
def list_crop_calendars():
    query = CropCalendar.query

    if "crop_id" in request.args:
        raw_crop_id = request.args.get("crop_id", "").strip()
        if raw_crop_id: # Only validate if not empty
            crop_id = parse_positive_int(raw_crop_id)
            if crop_id is None:
                return validation_error({"crop_id": "crop_id must be an integer"})
            query = query.filter(CropCalendar.crop_id == crop_id)

    for param, column in EXACT_FILTERS.items():
        value = request.args.get(param, "").strip()
        if value:
            query = query.filter(func.lower(column) == value.lower())

    zone = request.args.get("agroecological_zone", "").strip()
    if zone:
        query = query.filter(
            CropCalendar.agroecological_zone.icontains(zone, autoescape=True)
        )

    calendars = query.order_by(CropCalendar.crop_id, CropCalendar.id).all()
    return {"data": [crop_calendar_to_dict(c) for c in calendars]}, 200


@crop_calendars_bp.route("/crop-calendars/<int:calendar_id>", methods=["GET"])
@login_required
def get_crop_calendar(calendar_id):
    calendar = db.session.get(CropCalendar, calendar_id)
    if calendar is None:
        return error_response("Crop calendar not found", 404)
    return {"data": crop_calendar_to_dict(calendar)}, 200


@crop_calendars_bp.route("/sources/<int:source_id>", methods=["GET"])
@login_required
def get_source(source_id):
    source = db.session.get(Source, source_id)
    if source is None:
        return error_response("Source not found", 404)
    return {"data": source_to_dict(source)}, 200
