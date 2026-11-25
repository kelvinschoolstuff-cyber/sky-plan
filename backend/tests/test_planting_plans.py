import pytest
from flask import Flask

from app.extensions import db
from app.models import Crop, Farm, User
from app.routes.planting_plans import bp


@pytest.fixture
def api_client():
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY="test",
        SQLALCHEMY_DATABASE_URI="sqlite://",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        TESTING=True,
    )
    db.init_app(app)
    app.register_blueprint(bp)

    with app.app_context():
        db.create_all()
        owner = User(username="owner", email="owner@example.com", password_hash="x")
        other = User(username="other", email="other@example.com", password_hash="x")
        crop = Crop(name="Maize")
        db.session.add_all([owner, other, crop])
        db.session.flush()

        farm = Farm(name="Owner farm", location="Nakuru", county="Nakuru", user_id=owner.id)
        other_farm = Farm(name="Other farm", location="Nairobi", county="Nairobi", user_id=other.id)
        db.session.add_all([farm, other_farm])
        db.session.commit()

        ids = {
            "owner": owner.id,
            "other": other.id,
            "farm": farm.id,
            "other_farm": other_farm.id,
            "crop": crop.id,
        }

    with app.test_client() as client:
        yield client, ids

    with app.app_context():
        db.session.remove()
        db.drop_all()


def login(client, user_id):
    with client.session_transaction() as browser_session:
        browser_session["user_id"] = user_id


def plan_payload(crop_id):
    return {
        "crop_id": crop_id,
        "season": "Long rains",
        "planting_date": "2027-03-01",
        "expected_harvest_date": "2027-07-15",
        "acreage": 2.5,
    }


def create_plan(client, farm_id, payload=None, crop_id=None):
    body = payload.copy() if payload is not None else plan_payload(crop_id)

    return client.post(
        f"/api/farms/{farm_id}/planting-plans",
         json=body)


def test_requires_login(api_client):
    client, ids = api_client
    assert client.get("/api/planting-plans").status_code == 401
    assert create_plan(client, ids["farm"], crop_id=ids["crop"]).status_code == 401


def test_create_read_update_delete(api_client):
    client, ids = api_client
    login(client, ids["owner"])

    created = create_plan(client, ids["farm"], crop_id=ids["crop"])
    assert created.status_code == 201
    assert created.json["data"]["status"] == "planned"
    plan_id = created.json["data"]["id"]

    listed = client.get("/api/planting-plans")
    assert listed.status_code == 200
    assert listed.json["pagination"] == {
        "page": 1, "per_page": 10, "total": 1, "pages": 1,
    }

    fetched = client.get(f"/api/planting-plans/{plan_id}")
    assert fetched.status_code == 200
    assert fetched.json["data"]["crop_id"] == ids["crop"]

    updated = client.patch(f"/api/planting-plans/{plan_id}", json={"season": "Short rains"})
    assert updated.status_code == 200
    assert updated.json["data"]["season"] == "Short rains"

    assert client.delete(f"/api/planting-plans/{plan_id}").status_code == 200
    assert client.get(f"/api/planting-plans/{plan_id}").status_code == 404


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("planting_date", "2027-02-30"),
        ("acreage", 0),
        ("acreage", -1),
        ("acreage", float("inf")),
        ("acreage", float("nan")),
        ("crop_id", 99999),
    ],
)
def test_bad_values_rejected(api_client, field, value):
    client, ids = api_client
    login(client, ids["owner"])

    payload = plan_payload(ids["crop"])
    payload[field] = value

    response = create_plan(client, ids["farm"], payload=payload)
    assert response.status_code == 400
    assert field in response.json["details"]


def test_harvest_before_planting_rejected(api_client):
    client, ids = api_client
    login(client, ids["owner"])

    payload = plan_payload(ids["crop"])
    payload["expected_harvest_date"] = "2027-02-28"

    response = create_plan(client, ids["farm"], payload=payload)
    assert response.status_code == 400
    assert "expected_harvest_date" in response.json["details"]


def test_patch_cannot_break_date_order(api_client):
    client, ids = api_client
    login(client, ids["owner"])

    plan_id = create_plan(client, ids["farm"], crop_id=ids["crop"]).json["data"]["id"]

    response = client.patch(f"/api/planting-plans/{plan_id}", json={"planting_date": "2027-08-01"})
    assert response.status_code == 400
    assert "expected_harvest_date" in response.json["details"]


def test_empty_body_rejected(api_client):
    client, ids = api_client
    login(client, ids["owner"])

    response = create_plan(client, ids["farm"], payload={})
    assert response.status_code == 400
    assert "crop_id" in response.json["details"]
    assert "planting_date" in response.json["details"]

def test_cannot_create_plan_for_another_users_farm(api_client):
    client, ids = api_client
    login(client, ids["owner"])

    response = create_plan(
        client,
        ids["other_farm"],
    )

    assert response.status_code == 404

def test_body_cannot_override_user_id(api_client):
    client, ids = api_client
    login(client, ids["owner"])

    payload = plan_payload(ids["crop"])
    payload["user_id"] = ids["other"]
    payload["farm_id"] = ids["other_farm"]

    response = create_plan(
        client,
        ids["farm"],
        payload=payload
    )

    assert response.status_code == 400

def test_pagination_and_farm_filter(api_client):
    client, ids = api_client
    login(client, ids["owner"])

    for _ in range(3):
        assert create_plan(client, ids["farm"], crop_id=ids["crop"]).status_code == 201

    page = client.get("/api/planting-plans?page=2&per_page=1")
    assert page.status_code == 200
    assert page.json["pagination"]["page"] == 2
    assert page.json["pagination"]["per_page"] == 1
    assert page.json["pagination"]["total"] == 3
    assert len(page.json["data"]) == 1

    filtered = client.get(f"/api/planting-plans?farm_id={ids['farm']}&per_page=50")
    assert filtered.status_code == 200
    assert filtered.json["pagination"]["total"] == 3

    capped = client.get("/api/planting-plans?per_page=100")
    assert capped.status_code == 200
    assert capped.json["pagination"]["per_page"] == 50


def test_other_user_cannot_touch_plans(api_client):
    client, ids = api_client
    login(client, ids["owner"])

    assert create_plan(client, ids["other_farm"], crop_id=ids["crop"]).status_code == 404

    plan_id = create_plan(client, ids["farm"], crop_id=ids["crop"]).json["data"]["id"]
    login(client, ids["other"])

    assert client.get("/api/planting-plans").json["data"] == []
    assert client.get(f"/api/planting-plans/{plan_id}").status_code == 404
    assert client.patch(f"/api/planting-plans/{plan_id}", json={"season": "x"}).status_code == 404
    assert client.delete(f"/api/planting-plans/{plan_id}").status_code == 404
    assert client.get(f"/api/planting-plans?farm_id={ids['farm']}").status_code == 404