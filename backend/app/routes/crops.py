from flask import Blueprint
from app.extensions import db
from app.models import Crop
from app.serializers import crop_to_dict
from app.utils import error_response, login_required

crops_bp = Blueprint("crops", __name__, url_prefix="/api")


@crops_bp.route("/crops", methods=["GET"])
@login_required
def list_crops():
    crops = Crop.query.order_by(Crop.name).all()
    return {"data": [crop_to_dict(c) for c in crops]}, 200


@crops_bp.route("/crops/<int:crop_id>", methods=["GET"])
@login_required
def get_crop(crop_id):
    crop = db.session.get(Crop, crop_id)
    if crop is None:
        return error_response("Crop not found", 404)
    return {"data": crop_to_dict(crop)}, 200
