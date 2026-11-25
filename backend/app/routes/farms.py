from flask import Blueprint, g
from app.extensions import db
from app.models import Farm
from app.serializers import farm_to_dict
from app.utils import (
    clean_string,
    error_response,
    get_json_object,
    invalid_body_response,
    login_required,
    validation_error,
)

farms_bp = Blueprint("farms", __name__, url_prefix="/api")

FARM_FIELDS = {
    "name": (120, True),
    "location": (150, True),
    "county": (100, True),
    "agroecological_zone": (120, False),
}


def _owned_farm_or_none(farm_id):
    """Fetch a farm only if it belongs to the current user."""
    return Farm.query.filter_by(id=farm_id, user_id=g.current_user.id).first()


def _validate_farm(data, partial):
    clean, errors = {}, {}
    for field, (max_length, required) in FARM_FIELDS.items():
        if partial and field not in data:
            continue
            
        # Allow clearing optional fields by sending an empty string or null
        if not required and data.get(field) in ("", None):
            clean[field] = None
            continue

        value, problem = clean_string(data.get(field), max_length, required)
        if problem:
            errors[field] = problem
        else:
            clean[field] = value
            
    return clean, errors


@farms_bp.route("/farms", methods=["GET"])
@login_required
def list_farms():
    farms = (
        Farm.query.filter_by(user_id=g.current_user.id)
        .order_by(Farm.created_at.desc(), Farm.id.desc())
        .all()
    )
    return {"data": [farm_to_dict(f) for f in farms]}, 200


@farms_bp.route("/farms", methods=["POST"])
@login_required
def create_farm():
    data = get_json_object()
    if data is None:
        return invalid_body_response()

    clean, errors = _validate_farm(data, partial=False)
    if errors:
        return validation_error(errors)

    # user_id always comes from the session; any client value is ignored.
    farm = Farm(user_id=g.current_user.id, **clean)
    db.session.add(farm)
    db.session.commit()
    return {"message": "Farm created successfully", "data": farm_to_dict(farm)}, 201


@farms_bp.route("/farms/<int:farm_id>", methods=["GET"])
@login_required
def get_farm(farm_id):
    farm = _owned_farm_or_none(farm_id)
    if farm is None:
        return error_response("Farm not found", 404)
    return {"data": farm_to_dict(farm)}, 200


@farms_bp.route("/farms/<int:farm_id>", methods=["PATCH"])
@login_required
def update_farm(farm_id):
    farm = _owned_farm_or_none(farm_id)
    if farm is None:
        return error_response("Farm not found", 404)

    data = get_json_object()
    if data is None:
        return invalid_body_response()

    clean, errors = _validate_farm(data, partial=True)
    if errors:
        return validation_error(errors)
    if not clean:
        return error_response("No updatable fields provided", 400)

    for field, value in clean.items():
        setattr(farm, field, value)
    db.session.commit()
    return {"message": "Farm updated successfully", "data": farm_to_dict(farm)}, 200


@farms_bp.route("/farms/<int:farm_id>", methods=["DELETE"])
@login_required
def delete_farm(farm_id):
    farm = _owned_farm_or_none(farm_id)
    if farm is None:
        return error_response("Farm not found", 404)

    db.session.delete(farm)  # cascades to the farm's planting plans
    db.session.commit()
    return {"message": "Farm deleted successfully"}, 200
