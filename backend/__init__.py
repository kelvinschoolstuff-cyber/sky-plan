from __future__ import annotations

import os
import secrets
from pathlib import Path

from flask import Flask
from flask_cors import CORS
from flask_session import Session
from cachelib.file import FileSystemCache

from backend.auth import auth_blueprint
from backend.extensions import bcrypt, db


def create_app(test_config: dict | None = None) -> Flask:
    instance_path = Path(__file__).resolve().parent / "instance"
    instance_path.mkdir(parents=True, exist_ok=True)

    configured_origins = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    app = Flask(__name__, instance_path=str(instance_path))
    app.config.from_mapping(
        SECRET_KEY=os.environ.get("SECRET_KEY") or secrets.token_hex(32),
        APP_ENV=os.environ.get("APP_ENV", "development"),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            "DATABASE_URL",
            f"sqlite:///{instance_path / 'auth.sqlite3'}",
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SESSION_TYPE="cachelib",
        SESSION_CACHE_DIR=os.environ.get(
            "SESSION_CACHE_DIR",
            str(instance_path / "sessions"),
        ),
        SESSION_CACHELIB=None,
        SESSION_PERMANENT=False,
        SESSION_USE_SIGNER=False,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE=os.environ.get("SESSION_COOKIE_SAMESITE", "Lax"),
        SESSION_COOKIE_SECURE=os.environ.get(
            "SESSION_COOKIE_SECURE",
            "true" if os.environ.get("APP_ENV") == "production" else "false",
        ).lower()
        in {"true", "1", "yes"},
        CORS_ORIGINS=[
            origin.strip()
            for origin in configured_origins.split(",")
            if origin.strip()
        ],
    )
    if test_config:
        app.config.update(test_config)
    if app.config["APP_ENV"] == "production" and not (
        os.environ.get("SECRET_KEY")
        or (test_config and test_config.get("SECRET_KEY"))
    ):
        raise RuntimeError("SECRET_KEY must be configured in production.")

    if app.config["SESSION_CACHELIB"] is None:
        cache_dir = Path(app.config["SESSION_CACHE_DIR"])
        cache_dir.mkdir(parents=True, exist_ok=True)
        app.config["SESSION_CACHELIB"] = FileSystemCache(
            cache_dir=str(cache_dir),
            threshold=500,
            default_timeout=300,
            mode=0o600,
        )

    db.init_app(app)
    bcrypt.init_app(app)
    Session(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    app.register_blueprint(auth_blueprint)

    with app.app_context():
        db.create_all()

    return app
