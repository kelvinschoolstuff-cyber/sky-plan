from dotenv import load_dotenv
load_dotenv()

import os
from cachelib import FileSystemCache
from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db, migrate, bcrypt
from flask_session import Session
from app.models import (
    User, 
    Farm, 
    PlantingPlan,
    Crop,
    Source,
    CropCalendar,
    )
from app.routes.planting_plans import bp as planting_plans_bp
from app.routes.farms import farms_bp
from app.routes.crops import  crops_bp
from app.routes.crop_calendars import crop_calendars_bp
from app.routes.auth import bp as auth_bp


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config.update(
        SESSION_TYPE="cachelib",
        SESSION_PERMANENT=False,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("APP_ENV", "").lower() == "production",
    )
    if not app.config.get("SECRET_KEY"):
        app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")
    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        app.config["SQLALCHEMY_DATABASE_URI"] = (
            os.environ.get("SQLALCHEMY_DATABASE_URI") or os.environ.get("DATABASE_URL")
        )
    if test_config:
        app.config.update(test_config)
    if not app.config.get("SECRET_KEY"):
        raise RuntimeError("SECRET_KEY must be configured")
    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        raise RuntimeError("DATABASE_URL must be configured")

    if app.config.get("SESSION_CACHELIB") is None:
        cache_dir = app.config.get(
            "SESSION_CACHE_DIR",
            os.path.join(app.instance_path, "sessions"),
        )
        os.makedirs(cache_dir, exist_ok=True)
        app.config["SESSION_CACHELIB"] = FileSystemCache(
            cache_dir=cache_dir,
            threshold=500,
            default_timeout=300,
            mode=0o600,
        )

    app.register_blueprint(auth_bp)
    app.register_blueprint(planting_plans_bp)
    app.register_blueprint(farms_bp)
    app.register_blueprint(crops_bp)
    app.register_blueprint(crop_calendars_bp)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    Session(app)

    CORS(
        app,
        origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        supports_credentials=True,
    )

    @app.route("/")
    def index():
        return {"message": "Agricast API is running"}
    
    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Resource not found"}, 404

    return app