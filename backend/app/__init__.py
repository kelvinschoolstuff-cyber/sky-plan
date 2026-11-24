from dotenv import load_dotenv

load_dotenv()

import os
from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.extensions import db, migrate, bcrypt
from app.routes.planting_plans import bp as planting_plans_bp
from app.models import (
    User, 
    Farm, 
    PlantingPlan,
    Crop,
    Source,
    CropCalendar,
    )

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.register_blueprint(planting_plans_bp)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    CORS(
        app,
        origins=[os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")],
        supports_credentials=True,
    )

    @app.route("/")
    def index():
        return{"message": "Agricast API is running"}

    return app