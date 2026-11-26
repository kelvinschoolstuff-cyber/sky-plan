from collections.abc import Iterator
from pathlib import Path

import pytest
from flask import g, jsonify

from app import create_app
from app.extensions import bcrypt, db
from app.models import User
from app.routes.auth import login_required


@pytest.fixture()
def app(tmp_path: Path) -> Iterator:
    app = create_app(
        {
            "TESTING": True,
            "SECRET_KEY": "test-secret-key",
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{tmp_path / 'auth-test.sqlite3'}",
            "SESSION_CACHE_DIR": str(tmp_path / "sessions"),
            "SESSION_COOKIE_SECURE": True,
            "CORS_ORIGINS": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                ],
        }
    )

    @app.get("/api/test/protected")
    @login_required
    def protected():
        return jsonify(username=g.current_user.username)

    with app.app_context():
        db.create_all()

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def signup(client, username="farmer", email="farmer@example.com", password="harvest123"):
    return client.post(
        "/api/signup",
        json={"username": username, "email": email, "password": password},
    )


def login(client, email="farmer@example.com", password="harvest123", headers=None):
    return client.post(
        "/api/login",
        json={"email": email, "password": password},
        headers=headers,
    )


def test_signup_stores_only_bcrypt_hash_and_normalizes_email(client, app):
    response = signup(client, email="FARMER@EXAMPLE.COM")

    assert response.status_code == 201
    assert response.json == {
        "user": {
            "id": 1,
            "username": "farmer",
            "email": "farmer@example.com",
        }
    }
    with app.app_context():
        user = db.session.get(User, 1)
        assert user is not None
        assert user.password_hash != "harvest123"
        assert bcrypt.check_password_hash(user.password_hash, "harvest123")
        assert "password_hash" not in response.json["user"]


def test_signup_rejects_duplicate_username_and_email(client):
    assert signup(client).status_code == 201

    duplicate_username = signup(client, email="other@example.com")
    duplicate_email = signup(client, username="another", email="FARMER@example.com")

    assert duplicate_username.status_code == 409
    assert duplicate_username.json == {"error": "Username already exists"}
    assert duplicate_email.status_code == 409
    assert duplicate_email.json == {"error": "Email already exists"}


@pytest.mark.parametrize(
    ("payload", "message"),
    [
        (
            {"username": "ab", "email": "farmer@example.com", "password": "harvest123"},
            "Username must be 3 to 80 letters, numbers, '.', '_' or '-'",
        ),
        (
            {"username": "f" * 81, "email": "farmer@example.com", "password": "harvest123"},
            "Username must be 3 to 80 letters, numbers, '.', '_' or '-'",
        ),
        (
            {"username": "farmer name", "email": "farmer@example.com", "password": "harvest123"},
            "Username must be 3 to 80 letters, numbers, '.', '_' or '-'",
        ),
        (
            {"username": "farmer", "email": "invalid-email", "password": "harvest123"},
            "Enter a valid email address",
        ),
        (
            {"username": "farmer", "email": f'{"a" * 110}@example.com', "password": "harvest123"},
            "Enter a valid email address",
        ),
        (
            {"username": "farmer", "email": "farmer@example.com", "password": "short"},
            "Password must be at least 8 characters and no more than 72 UTF-8 bytes",
        ),
        (
            {"username": "farmer", "email": "farmer@example.com", "password": "é" * 40},
            "Password must be at least 8 characters and no more than 72 UTF-8 bytes",
        ),
    ],
)
def test_signup_rejects_invalid_fields(client, payload, message):
    response = client.post("/api/signup", json=payload)

    assert response.status_code == 400
    assert response.json == {"error": message}


def test_signup_rejects_missing_fields_and_non_object_body(client):
    missing_fields = client.post("/api/signup", json={"username": "farmer"})
    non_object = client.post("/api/signup", data="not json", content_type="application/json")

    assert missing_fields.status_code == 400
    assert missing_fields.json == {"error": "Username, email, and password are required"}
    assert non_object.status_code == 400
    assert non_object.json == {"error": "A JSON object is required"}


def test_login_persists_session_and_returns_public_user(client):
    assert signup(client).status_code == 201

    response = login(client, email="FARMER@example.com")

    assert response.status_code == 200
    user = {"id": 1, "username": "farmer", "email": "farmer@example.com"}
    assert response.json == {"user": user}
    assert client.get("/api/check_session").json == {
        "authenticated": True,
        "data": user,
    }
    assert client.get("/api/test/protected").json == {"username": "farmer"}


def test_login_returns_generic_error_for_invalid_credentials(client):
    assert signup(client).status_code == 201

    unknown_email = login(client, email="unknown@example.com")
    wrong_password = login(client, password="incorrect123")

    assert unknown_email.status_code == wrong_password.status_code == 401
    assert unknown_email.json == wrong_password.json == {
        "error": "Invalid email or password"
    }


def test_login_rejects_passwords_over_bcrypt_limit_with_generic_error(client):
    assert signup(client).status_code == 201

    response = login(client, password="x" * 73)

    assert response.status_code == 401
    assert response.json == {"error": "Invalid email or password"}


def test_login_rotates_server_side_session_identifier(client):
    assert signup(client).status_code == 201
    with client.session_transaction() as browser_session:
        browser_session["pre_authentication"] = True
    session_cookie_before_login = client.get_cookie("session").value

    response = login(client)

    assert response.status_code == 200
    assert client.get_cookie("session").value != session_cookie_before_login
    with client.session_transaction() as browser_session:
        assert browser_session["user_id"] == 1
        assert "pre_authentication" not in browser_session


def test_session_check_returns_unauthenticated_contract_shape(client):
    response = client.get("/api/check_session")

    assert response.status_code == 200
    assert response.json == {"authenticated": False}


def test_invalid_user_session_is_cleared(client):
    with client.session_transaction() as browser_session:
        browser_session["user_id"] = 999

    response = client.get("/api/check_session")

    assert response.json == {"authenticated": False}
    with client.session_transaction() as browser_session:
        assert "user_id" not in browser_session


def test_session_cookie_security_and_credentialed_cors(client):
    assert signup(client).status_code == 201

    response = login(
        client,
        headers={"Origin": "http://localhost:5173"},
    )

    cookie = response.headers["Set-Cookie"]
    assert "HttpOnly" in cookie
    assert "SameSite=Lax" in cookie
    assert "Secure" in cookie
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert response.headers["Access-Control-Allow-Credentials"] == "true"


def test_cors_does_not_allow_unconfigured_origins(client):
    response = client.get(
        "/api/check_session",
        headers={"Origin": "https://untrusted.example"},
    )

    assert "Access-Control-Allow-Origin" not in response.headers
    assert "Access-Control-Allow-Credentials" not in response.headers


def test_logout_clears_session_and_requires_authentication(client):
    rejected = client.post("/api/logout")
    assert rejected.status_code == 401

    assert signup(client).status_code == 201
    assert login(client).status_code == 200

    response = client.post("/api/logout")

    assert response.status_code == 200
    assert response.json == {"message": "Logged out successfully"}
    assert client.get("/api/check_session").json == {"authenticated": False}


def test_protected_route_rejects_unauthenticated_request(client):
    response = client.get("/api/test/protected")

    assert response.status_code == 401
    assert response.json == {"error": "Authentication required"}
