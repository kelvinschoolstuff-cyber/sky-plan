def ids(response):
    return {c["id"] for c in response.get_json()["data"]}


def test_calendar_collection(auth_client, calendars):
    response = auth_client.get("/api/crop-calendars")
    assert response.status_code == 200
    assert ids(response) == {c.id for c in calendars}


def test_calendar_detail_has_source_attribution(auth_client, calendars, source):
    response = auth_client.get(f"/api/crop-calendars/{calendars[0].id}")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["crop_name"] == "Maize"
    assert data["planting_window"] == {"start": "15 Mar", "end": "1 Apr"}
    assert data["harvest_window"] == {"start": "15 Sep", "end": "1 Jan"}
    assert data["verification_status"] == "unverified"
    assert data["source_id"] == source.id
    assert data["source"] == {
        "id": source.id, "title": "Test Crop Calendar",
        "organisation": "Test Organisation",
    }


def test_calendar_unavailable_values_are_null_not_invented(auth_client, calendars):
    data = auth_client.get(f"/api/crop-calendars/{calendars[1].id}").get_json()["data"]
    assert data["planting_window"] == {"start": None, "end": None}
    assert data["verification_status"] == "needs_review"


def test_verification_status_defaults_to_unverified(auth_client, calendars):
    data = auth_client.get(f"/api/crop-calendars/{calendars[2].id}").get_json()["data"]
    assert data["verification_status"] == "unverified"


def test_filter_by_crop(auth_client, calendars, crops):
    response = auth_client.get(f"/api/crop-calendars?crop_id={crops['beans'].id}")
    assert ids(response) == {calendars[2].id}


def test_filter_by_county_case_insensitive(auth_client, calendars):
    response = auth_client.get("/api/crop-calendars?county=nakuru")
    assert ids(response) == {calendars[0].id, calendars[2].id}


def test_filter_by_season(auth_client, calendars):
    response = auth_client.get("/api/crop-calendars?season=Short%20rains")
    assert ids(response) == {calendars[1].id, calendars[2].id}


def test_filter_by_agroecological_zone(auth_client, calendars):
    response = auth_client.get("/api/crop-calendars?agroecological_zone=Highland")
    assert ids(response) == {calendars[0].id, calendars[2].id}


def test_filter_by_sub_county(auth_client, calendars):
    assert auth_client.get("/api/crop-calendars?sub_county=Molo").get_json() == {"data": []}


def test_combined_filters(auth_client, calendars, crops):
    response = auth_client.get(
        f"/api/crop-calendars?crop_id={crops['maize'].id}&county=Nakuru"
        "&season=Long%20rains&agroecological_zone=UH"
    )
    assert ids(response) == {calendars[0].id}


def test_empty_results(auth_client, calendars):
    response = auth_client.get("/api/crop-calendars?county=Nowhere")
    assert response.status_code == 200
    assert response.get_json() == {"data": []}


def test_filter_wildcards_are_not_interpreted(auth_client, calendars):
    assert auth_client.get("/api/crop-calendars?county=%25").get_json() == {"data": []}


def test_invalid_crop_id_filter(auth_client, calendars):
    response = auth_client.get("/api/crop-calendars?crop_id=abc")
    assert response.status_code == 400


def test_calendar_not_found(auth_client, calendars):
    assert auth_client.get("/api/crop-calendars/9999").status_code == 404
    assert auth_client.get("/api/crop-calendars/abc").status_code == 404


def test_calendars_require_authentication(client, calendars):
    assert client.get("/api/crop-calendars").status_code == 401
    assert client.get(f"/api/crop-calendars/{calendars[0].id}").status_code == 401


def test_retrieve_source(auth_client, source):
    response = auth_client.get(f"/api/sources/{source.id}")
    assert response.status_code == 200
    data = response.get_json()["data"]
    assert data["organisation"] == "Test Organisation"
    assert data["title"] == "Test Crop Calendar"
    assert data["url"] == "https://example.org/calendar"
    assert data["licence"] == "CC BY 4.0"
    assert data["notes"] == "Test source"
    assert data["published_date"] is None


def test_source_not_found(auth_client):
    assert auth_client.get("/api/sources/9999").status_code == 404
    assert auth_client.get("/api/sources/abc").status_code == 404


def test_source_requires_authentication(client, source):
    assert client.get(f"/api/sources/{source.id}").status_code == 401