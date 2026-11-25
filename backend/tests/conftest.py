import pytest
import os
from app import create_app
from app.extensions import db
from app.models import Crop, CropCalendar, Farm, Source, User


@pytest.fixture()
def app():
    # 1. Monkeypatch the environment variables BEFORE the app is created
    # This forces it to use in-memory SQLite instead of PostgreSQL
    os.environ["DATABASE_URL"] = "sqlite:///:memory:"
    os.environ["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    os.environ["SECRET_KEY"] = "test-secret-key"

    # 2. Call the factory exactly as it expects (with no arguments)
    app = create_app()
    
    # 3. Ensure testing mode is on
    app.config["TESTING"] = True
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def make_user(username, email):
    user = User(username=username, email=email, password_hash="not-used-in-these-tests")
    db.session.add(user)
    db.session.commit()
    return user


def login_as(client, user):
    """Authenticate by setting the session directly (auth routes are another task)."""
    with client.session_transaction() as session:
        session["user_id"] = user.id


@pytest.fixture()
def user_a(app):
    return make_user("alice", "alice@example.com")


@pytest.fixture()
def user_b(app):
    return make_user("bob", "bob@example.com")


@pytest.fixture()
def auth_client(client, user_a):
    login_as(client, user_a)
    return client


@pytest.fixture()
def farm_a(user_a):
    farm = Farm(name="Alice Farm", location="Nakuru", county="Nakuru",
                agroecological_zone="Highland", user_id=user_a.id)
    db.session.add(farm)
    db.session.commit()
    return farm


@pytest.fixture()
def farm_b(user_b):
    farm = Farm(name="Bob Farm", location="Eldoret", county="Uasin Gishu", user_id=user_b.id)
    db.session.add(farm)
    db.session.commit()
    return farm


@pytest.fixture()
def crops(app):
    maize = Crop(name="Maize", description="Test maize")
    beans = Crop(name="Beans")
    db.session.add_all([maize, beans])
    db.session.commit()
    return {"maize": maize, "beans": beans}


@pytest.fixture()
def source(app):
    source = Source(organisation="Test Organisation", title="Test Crop Calendar",
                    url="https://example.org/calendar", licence="CC BY 4.0", notes="Test source")
    db.session.add(source)
    db.session.commit()
    return source


@pytest.fixture()
def calendars(crops, source):
    rows = [
        CropCalendar(crop_id=crops["maize"].id, county="Nakuru",
                     agroecological_zone="Upper Highland Zone 1 (UH 1)", season="Long rains",
                     planting_start="15 Mar", planting_end="1 Apr", harvest_start="15 Sep",
                     harvest_end="1 Jan", source_id=source.id, verification_status="unverified"),
        CropCalendar(crop_id=crops["maize"].id, county="Kisii",
                     agroecological_zone="Lower Midland Zone 4 (LM4)", season="Short rains",
                     source_id=source.id, verification_status="needs_review"),
        CropCalendar(crop_id=crops["beans"].id, county="Nakuru",
                     agroecological_zone="Upper Highland Zone 1 (UH 1)", season="Short rains",
                     source_id=source.id),
    ]
    db.session.add_all(rows)
    db.session.commit()
    return rows