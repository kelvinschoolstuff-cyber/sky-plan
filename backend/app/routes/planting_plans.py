from datetime import date
import math
import re

from flask import Blueprint, g, jsonify, request

from app.extensions import db
from app.models import Crop, Farm, PlantingPlan
from app.routes.auth import login_required
from sqlalchemy.exc import SQLAlchemyError

bp = Blueprint("planting_plans", __name__, url_prefix="/api")

# Fields a client is allowed to set. Anything else (user_id, farm_id) gets rejected.
WRITE_FIELDS = {
    "crop_id", "season", "planting_date",
    "expected_harvest_date", "acreage", "status", "notes",
}

ALLOWED_STATUSES = {
    "planned",
    "in_progress",
    "harvested",
    "cancelled",
}


def _error(message, status, details=None):
    body = {"error": message}
    if details is not None:
        body["details"] = details
    return jsonify(body), status

def _commit_changes():
    try:
        db.session.commit()
        return None
    except SQLAlchemyError:
        db.session.rollback()
        return _error(
            "A database error occured. Please try again.",
            500
        )


@bp.before_request
@login_required
def require_login():
    g.user_id = g.current_user.id


def _owned_farm(farm_id):
    return Farm.query.filter_by(id=farm_id, user_id=g.user_id).first()


def _owned_plan(plan_id):
    # A plan belongs to a user if its farm does
    return (
        PlantingPlan.query
        .join(Farm, PlantingPlan.farm_id == Farm.id)
        .filter(PlantingPlan.id == plan_id, Farm.user_id == g.user_id)
        .first()
    )


def _serialize(plan):
    return {
        "id": plan.id,
        "crop_id": plan.crop_id,
        "season": plan.season,
        "planting_date": plan.planting_date.isoformat(),
        "expected_harvest_date": plan.expected_harvest_date.isoformat(),
        "acreage": plan.acreage,
        "status": plan.status,
        "notes": plan.notes,
        "farm_id": plan.farm_id,
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
    }


def _parse_date(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _validate_payload(payload, plan=None):
    if not isinstance(payload, dict):
        return None, {"body": "Send a JSON object"}

    errors = {}
    changes = {}

    for field in payload:
        if field not in WRITE_FIELDS:
            errors[field] = "Not an accepted field"

    if plan is None:
        for field in ("crop_id", "season", "planting_date",
                      "expected_harvest_date", "acreage"):
            if field not in payload:
                errors[field] = "Required"
    elif not payload:
        errors["body"] = "Send at least one field to update"

    if "crop_id" in payload:
        crop_id = payload["crop_id"]
        if isinstance(crop_id, bool) or not isinstance(crop_id, int) or crop_id < 1:
            errors["crop_id"] = "Must be a positive integer"
        elif db.session.get(Crop, crop_id) is None:
            errors["crop_id"] = "No crop with that id"
        else:
            changes["crop_id"] = crop_id

    if "season" in payload:
        season = payload["season"]
        if not isinstance(season, str) or not season.strip() or len(season) > 100:
            errors["season"] = "Must be text, up to 100 characters"
        else:
            changes["season"] = season.strip()

    for field in ("planting_date", "expected_harvest_date"):
        if field in payload:
            parsed = _parse_date(payload[field])
            if parsed is None:
                errors[field] = "Use YYYY-MM-DD"
            else:
                changes[field] = parsed

    if "acreage" in payload:
        acreage = payload["acreage"]
        try:
            acreage_value = float(acreage)
        except (OverflowError, TypeError, ValueError):
            acreage_value = math.nan

        if (
            isinstance(acreage, bool)
            or not isinstance(acreage, (int, float))
            or not math.isfinite(acreage_value)
            or acreage_value <= 0
        ):
            errors["acreage"] = "Must be a finite number above zero"
        else:
            changes["acreage"] = acreage_value

    if "status" in payload:
        status = payload["status"]

        if isinstance(status, str):
            status = status.strip()

        if not isinstance(status, str) or status not in ALLOWED_STATUSES:
            errors["status"] = (
                f"Must be one of: {', '.join(sorted(ALLOWED_STATUSES))}"
            )
        else:
            changes["status"] = status

    elif plan is None:
        changes["status"] = "planned"

    if "notes" in payload:
        notes = payload["notes"]
        if notes is not None and not isinstance(notes, str):
            errors["notes"] = "Must be text or null"
        else:
            changes["notes"] = notes

    planting_date = changes.get("planting_date", plan.planting_date if plan else None)
    harvest_date = changes.get("expected_harvest_date", plan.expected_harvest_date if plan else None)
    if planting_date and harvest_date and harvest_date < planting_date:
        errors["expected_harvest_date"] = "Can't be before the planting date"

    if errors:
        return None, errors
    return changes, None


@bp.get("/planting-plans")
def list_planting_plans():
    try:
        page = int(request.args.get("page", "1"))
    except ValueError:
        return _error("Bad query string", 400, {"page": "Must be an integer"})

    try:
        per_page = int(request.args.get("per_page", "10"))
    except ValueError:
        return _error("Bad query string", 400, {"per_page": "Must be an integer"})

    if page < 1:
        return _error("Bad query string", 400, {"page": "Must be 1 or more"})
    if per_page < 1:
        return _error("Bad query string", 400, {"per_page": "Must be 1 or more"})

    per_page = min(per_page, 50)

    query = (
        PlantingPlan.query
        .join(Farm, PlantingPlan.farm_id == Farm.id)
        .filter(Farm.user_id == g.user_id)
    )

    farm_id = request.args.get("farm_id")
    if farm_id is not None:
        try:
            farm_id = int(farm_id)
        except ValueError:
            return _error("Bad query string", 400, {"farm_id": "Must be an integer"})
        if farm_id < 1 or _owned_farm(farm_id) is None:
            return _error("Farm not found", 404)
        query = query.filter(PlantingPlan.farm_id == farm_id)

    result = query.order_by(PlantingPlan.id).paginate(
        page=page, per_page=per_page, error_out=False,
    )
    return jsonify({
        "data": [_serialize(p) for p in result.items],
        "pagination": {
            "page": result.page,
            "per_page": result.per_page,
            "total": result.total,
            "pages": result.pages,
        },
    })

@bp.post("/farms/<int:farm_id>/planting-plans")
def create_planting_plan(farm_id):
    farm = _owned_farm(farm_id)

    if farm is None:
        return _error("Farm not found", 404)

    payload = request.get_json(silent=True)

    if not isinstance(payload, dict):
        return _error("Send a JSON object", 400)

    changes, errors = _validate_payload(payload)

    if errors:
        return _error("Validation failed", 400, errors)
    
    plan = PlantingPlan(
        farm_id=farm.id,
        **changes
    )

    db.session.add(plan)

    error_response = _commit_changes()

    if error_response:
        return error_response
    
    return jsonify({
        "message": "Planting plan created successfully",
        "data": _serialize(plan)
    }), 201
    

@bp.get("/planting-plans/<int:plan_id>")
def get_planting_plan(plan_id):
    plan = _owned_plan(plan_id)
    if plan is None:
        return _error("Not found", 404)
    return jsonify({"data": _serialize(plan)})


@bp.patch("/planting-plans/<int:plan_id>")
def update_planting_plan(plan_id):
    plan = _owned_plan(plan_id)
    if plan is None:
        return _error("Not found", 404)

    changes, errors = _validate_payload(request.get_json(silent=True), plan=plan)
    if errors:
        return _error("Validation failed", 400, errors)

    for field, value in changes.items():
        setattr(plan, field, value)

    error_response = _commit_changes()

    if error_response:
        return error_response
    
    return jsonify({
        "message": "Updated",
        "data": _serialize(plan)
    })


@bp.delete("/planting-plans/<int:plan_id>")
def delete_planting_plan(plan_id):
    plan = _owned_plan(plan_id)
    if plan is None:
        return _error("Not found", 404)

    db.session.delete(plan)
    
    error_response = _commit_changes()

    if error_response:
        return error_response
    
    return jsonify({"message": "Deleted"})