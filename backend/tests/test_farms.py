from app.models import Farm, PlantingPlan, Crop
from app.extensions import db

NEW_FARM = {
    "name": "Green Valley Farm",
    "location": "Nakuru",
    "county": "Nakuru",
    "agroecological_zone": "Highland",
}


def test_create_farm(auth_client, user_a):
    response = auth_client.post("/api/farms", json=NEW_FARM)
    assert response.status_code == 201
    body = response.get_json()
    assert body["message"] == "Farm created successfully"
    assert body["data"]["name"] == "Green Valley Farm"
    assert db.session.get(Farm, body["data"]["id"]).user_id == user_a.id


def test_create_farm_ignores_client_user_id(auth_client, user_a, user_b):
    response = auth_client.post("/api/farms", json={**NEW_FARM, "user_id": user_b.id})
    assert response.status_code == 201
    assert db.session.get(Farm, response.get_json()["data"]["id"]).user_id == user_a.id
    assert "user_id" not in response.get_json()["data"]


def test_create_farm_zone_optional(auth_client):
    payload = {k: v for k, v in NEW_FARM.items() if k != "agroecological_zone"}
    response = auth_client.post("/api/farms", json=payload)
    assert response.status_code == 201
    assert response.get_json()["data"]["agroecological_zone"] is None


def test_create_farm_required_fields(auth_client):
    response = auth_client.post("/api/farms", json={"agroecological_zone": "Highland"})
    assert response.status_code == 400
    body = response.get_json()
    assert body["error"] == "Validation failed"
    assert set(body["details"]) == {"name", "location", "county"}


def test_create_farm_rejects_blank_and_too_long(auth_client):
    assert auth_client.post("/api/farms", json={**NEW_FARM, "name": "   "}).status_code == 400
    assert auth_client.post("/api/farms", json={**NEW_FARM, "name": "x" * 121}).status_code == 400
    assert auth_client.post("/api/farms", json={**NEW_FARM, "county": 5}).status_code == 400


def test_list_farms_only_returns_own(auth_client, farm_a, farm_b):
    response = auth_client.get("/api/farms")
    assert response.status_code == 200
    ids = [f["id"] for f in response.get_json()["data"]]
    assert ids == [farm_a.id]


def test_list_farms_empty(auth_client):
    assert auth_client.get("/api/farms").get_json() == {"data": []}


def test_get_farm(auth_client, farm_a):
    response = auth_client.get(f"/api/farms/{farm_a.id}")
    assert response.status_code == 200
    assert response.get_json()["data"]["name"] == "Alice Farm"
    assert set(response.get_json()["data"]) == {
        "id", "name", "location", "county", "agroecological_zone"}


def test_update_farm(auth_client, farm_a):
    response = auth_client.patch(
        f"/api/farms/{farm_a.id}", json={"name": "Renamed", "agroecological_zone": ""}
    )
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["name"] == "Renamed"
    assert data["agroecological_zone"] is None
    assert data["location"] == "Nakuru"  # untouched


def test_update_farm_validation(auth_client, farm_a):
    assert auth_client.patch(f"/api/farms/{farm_a.id}", json={"name": ""}).status_code == 400
    assert auth_client.patch(f"/api/farms/{farm_a.id}", json={}).status_code == 400


def test_update_cannot_change_owner(auth_client, farm_a, user_a, user_b):
    auth_client.patch(f"/api/farms/{farm_a.id}", json={"user_id": user_b.id, "name": "X"})
    assert db.session.get(Farm, farm_a.id).user_id == user_a.id


def test_delete_farm(auth_client, farm_a):
    response = auth_client.delete(f"/api/farms/{farm_a.id}")
    assert response.status_code == 200
    assert "message" in response.get_json()
    assert auth_client.get(f"/api/farms/{farm_a.id}").status_code == 404


def test_delete_farm_cascades_to_planting_plans(auth_client, farm_a, crops):
    from datetime import date
    plan = PlantingPlan(farm_id=farm_a.id, crop_id=crops["maize"].id, season="Long rains",
                        planting_date=date(2027, 3, 1),
                        expected_harvest_date=date(2027, 7, 1), acreage=1.0)
    db.session.add(plan)
    db.session.commit()
    plan_id = plan.id

    assert auth_client.delete(f"/api/farms/{farm_a.id}").status_code == 200
    assert db.session.get(PlantingPlan, plan_id) is None
    assert db.session.get(Crop, crops["maize"].id) is not None  # crop kept


def test_user_a_cannot_access_user_b_farm(auth_client, farm_b):
    path = f"/api/farms/{farm_b.id}"
    assert auth_client.get(path).status_code == 404
    assert auth_client.patch(path, json={"name": "Hacked"}).status_code == 404
    assert auth_client.delete(path).status_code == 404
    assert db.session.get(Farm, farm_b.id).name == "Bob Farm"


def test_missing_farm_is_404(auth_client):
    assert auth_client.get("/api/farms/9999").status_code == 404


def test_farm_endpoints_require_authentication(client):
    for method, path in [("get", "/api/farms"), ("post", "/api/farms"),
                         ("get", "/api/farms/1"), ("patch", "/api/farms/1"),
                         ("delete", "/api/farms/1")]:
        response = getattr(client, method)(path)
        assert response.status_code == 401, f"{method.upper()} {path}"