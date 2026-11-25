def test_crop_collection(auth_client, crops):
    response = auth_client.get("/api/crops")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert [c["name"] for c in data] == ["Beans", "Maize"]  # alphabetical


def test_crop_collection_empty(auth_client):
    assert auth_client.get("/api/crops").get_json() == {"data": []}


def test_crop_detail(auth_client, crops):
    response = auth_client.get(f"/api/crops/{crops['maize'].id}")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["id"] == crops["maize"].id
    assert data["name"] == "Maize"
    assert data["description"] == "Test maize"
    assert "general guidance" in data["disclaimer"].lower()


def test_crop_not_found(auth_client, crops):
    response = auth_client.get("/api/crops/9999")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_crop_invalid_id(auth_client):
    response = auth_client.get("/api/crops/abc")
    assert response.status_code == 404
    assert "error" in response.get_json()


def test_crops_require_authentication(client, crops):
    assert client.get("/api/crops").status_code == 401
    assert client.get(f"/api/crops/{crops['maize'].id}").status_code == 401