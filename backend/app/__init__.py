from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db, migrate, bcrypt
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


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.register_blueprint(planting_plans_bp)
    app.register_blueprint(farms_bp)
    app.register_blueprint(crops_bp)
    app.register_blueprint(crop_calendars_bp)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    CORS(
        app,
        origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173"
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