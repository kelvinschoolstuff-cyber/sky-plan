from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import pytest
from flask import jsonify

from backend import create_app
from backend.auth import login_required
from backend.extensions import bcrypt, db
from backend.models import User


@pytest.fixture()
def app(tmp_path: Path) -> Iterator:
    app = create_app(
        {
            "TESTING": True,
            "SECRET_KEY": "test-secret-key",
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{tmp_path / 'test.sqlite3'}",
            "SESSION_CACHE_DIR": str(tmp_path / "sessions"),
            "SESSION_COOKIE_SECURE": False,
            "CORS_ORIGINS": ["http://localhost:5173"],
        }
    )

    @app.get("/api/test/protected")
    @login_required
    def protected():
        user = db.session.get(User, 1)
        assert user is not None
        return jsonify(username=user.username)

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


def test_signup_stores_only_bcrypt_hash_and_returns_public_user(client, app):
    response = signup(client)

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


def test_signup_rejects_duplicate_username_case_insensitively(client):
    assert signup(client).status_code == 201

    response = signup(client, username="Farmer", email="other@example.com")

    assert response.status_code == 409
    assert response.json == {"error": "Username already exists."}


def test_signup_rejects_duplicate_email_case_insensitively(client):
    assert signup(client).status_code == 201

    response = signup(client, username="another", email="FARMER@example.com")

    assert response.status_code == 409
    assert response.json == {"error": "Email already exists."}


@pytest.mark.parametrize(
    ("payload", "message"),
    [
        (
            {"username": "farmer", "email": "invalid-email", "password": "harvest123"},
            "Enter a valid email address.",
        ),
        (
            {"username": "ab", "email": "farmer@example.com", "password": "harvest123"},
            "Username must be 3 to 32 characters long.",
        ),
        (
            {"username": "f" * 33, "email": "farmer@example.com", "password": "harvest123"},
            "Username must be 3 to 32 characters long.",
        ),
        (
            {"username": "farmer", "email": f'{"a" * 245}@example.com', "password": "harvest123"},
            "Enter a valid email address.",
        ),
        (
            {"username": "farmer", "email": "farmer@example.com", "password": "short"},
            "Password must be at least 8 characters and no more than 72 UTF-8 bytes.",
        ),
        (
            {"username": "farmer", "email": "farmer@example.com", "password": "é" * 40},
            "Password must be at least 8 characters and no more than 72 UTF-8 bytes.",
        ),
    ],
)
def test_signup_validates_email_and_field_lengths(client, payload, message):
    response = client.post("/api/signup", json=payload)

    assert response.status_code == 400
    assert response.json == {"error": message}


def test_signup_rejects_missing_fields(client):
    response = client.post("/api/signup", json={"username": "farmer"})

    assert response.status_code == 400
    assert response.json == {"error": "Username, email, and password are required."}


def test_login_authenticates_and_persists_session_across_requests(client):
    assert signup(client).status_code == 201

    login_response = client.post(
        "/api/login",
        json={"email": "FARMER@example.com", "password": "harvest123"},
    )

    assert login_response.status_code == 200
    assert login_response.json["user"] == {
        "id": 1,
        "username": "farmer",
        "email": "farmer@example.com",
    }
    assert client.get("/api/check_session").json == {
        "authenticated": True,
        "user": login_response.json["user"],
    }
    assert client.get("/api/test/protected").status_code == 200


def test_login_returns_same_generic_error_for_unknown_email_and_bad_password(client):
    assert signup(client).status_code == 201

    unknown_email = client.post(
        "/api/login",
        json={"email": "unknown@example.com", "password": "harvest123"},
    )
    wrong_password = client.post(
        "/api/login",
        json={"email": "farmer@example.com", "password": "incorrect123"},
    )

    assert unknown_email.status_code == wrong_password.status_code == 401
    assert unknown_email.json == wrong_password.json == {
        "error": "Invalid email or password."
    }


def test_login_rejects_passwords_outside_bcrypt_limit_with_generic_error(client):
    assert signup(client).status_code == 201

    response = client.post(
        "/api/login",
        json={"email": "farmer@example.com", "password": "x" * 73},
    )

    assert response.status_code == 401
    assert response.json == {"error": "Invalid email or password."}


def test_session_check_returns_consistent_unauthenticated_state(client):
    response = client.get("/api/check_session")

    assert response.status_code == 200
    assert response.json == {"authenticated": False, "user": None}


def test_session_cookie_is_http_only_and_cors_allows_configured_origin(client):
    assert signup(client).status_code == 201

    response = client.post(
        "/api/login",
        json={"email": "farmer@example.com", "password": "harvest123"},
        headers={"Origin": "http://localhost:5173"},
    )

    cookie = response.headers["Set-Cookie"]
    assert "HttpOnly" in cookie
    assert "SameSite=Lax" in cookie
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert response.headers["Access-Control-Allow-Credentials"] == "true"


def test_cors_does_not_reflect_unconfigured_origins(client):
    response = client.get(
        "/api/check_session",
        headers={"Origin": "https://untrusted.example"},
    )

    assert "Access-Control-Allow-Origin" not in response.headers
    assert "Access-Control-Allow-Credentials" not in response.headers


def test_login_rotates_server_side_session_id(client):
    assert signup(client).status_code == 201
    with client.session_transaction() as browser_session:
        browser_session["pre_authentication"] = True
    session_cookie_before_login = client.get_cookie("session").value

    response = client.post(
        "/api/login",
        json={"email": "farmer@example.com", "password": "harvest123"},
    )

    assert response.status_code == 200
    assert client.get_cookie("session").value != session_cookie_before_login


def test_logout_clears_session(client):
    assert signup(client).status_code == 201
    assert client.post(
        "/api/login",
        json={"email": "farmer@example.com", "password": "harvest123"},
    ).status_code == 200

    response = client.post("/api/logout")

    assert response.status_code == 200
    assert response.json == {"message": "Logged out successfully."}
    assert client.get("/api/check_session").json == {
        "authenticated": False,
        "user": None,
    }


def test_protected_route_rejects_unauthenticated_request(client):
    response = client.get("/api/test/protected")

    assert response.status_code == 401
    assert response.json == {"error": "Authentication required."}
