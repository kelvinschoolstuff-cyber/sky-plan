
from datetime import date

from app import create_app
from app.extensions import db, bcrypt
from app.models import (
    User,
    Farm,
    PlantingPlan,
    Crop,
    Source,
    CropCalendar,
)


def get_or_create(model, lookup, defaults=None):
    """
    Find an existing record using stable identifying fields.
    Create it only when it does not already exist.
    """
    instance = model.query.filter_by(**lookup).first()

    if instance:
        return instance, False

    values = {**lookup, **(defaults or {})}
    instance = model(**values)

    db.session.add(instance)
    db.session.flush()

    return instance, True


def seed_users():
    users = {}

    sample_users = [
        {
            "username": "demo_farmer",
            "email": "farmer@example.com",
            "password": "FarmerDemo123!",
        },
        {
            "username": "demo_manager",
            "email": "manager@example.com",
            "password": "ManagerDemo123!",
        },
    ]

    for data in sample_users:
        password_hash = bcrypt.generate_password_hash(
            data["password"]
        ).decode("utf-8")

        user, created = get_or_create(
            User,
            {"email": data["email"]},
            {
                "username": data["username"],
                "password_hash": password_hash,
            },
        )

        # Existing users are not assigned a new password on reruns.
        users[data["username"]] = user

        print(f"{'Created' if created else 'Found'} user: {user.username}")

    return users


def seed_farms(users):
    farms = {}

    sample_farms = [
        {
            "name": "Green Valley Farm",
            "location": "Nakuru",
            "county": "Nakuru",
            "agroecological_zone": "Highland",
            "owner": "demo_farmer",
        },
        {
            "name": "Sunrise Farm",
            "location": "Kitale",
            "county": "Trans Nzoia",
            "agroecological_zone": "Highland",
            "owner": "demo_farmer",
        },
        {
            "name": "Eastern Harvest Farm",
            "location": "Kitui",
            "county": "Kitui",
            "agroecological_zone": "Semi-arid",
            "owner": "demo_manager",
        },
    ]

    for data in sample_farms:
        owner = users[data["owner"]]

        farm, created = get_or_create(
            Farm,
            {
                "name": data["name"],
                "user_id": owner.id,
            },
            {
                "location": data["location"],
                "county": data["county"],
                "agroecological_zone": data["agroecological_zone"],
            },
        )

        farms[data["name"]] = farm

        print(f"{'Created' if created else 'Found'} farm: {farm.name}")

    return farms


def seed_crops():
    crops = {}

    sample_crops = [
        {
            "name": "Maize",
            "description": "A major cereal crop grown for food and animal feed.",
            "growing_duration": 120,
            "suitable_temperature": "Varies by variety and growing conditions",
            "rainfall_requirements": "Depends on variety, soil and season",
            "soil_requirements": "Well-drained, fertile soil",
            "water_requirements": "Adequate moisture, especially during flowering and grain filling",
            "management_practices": "Timely planting, weed management, soil fertility management and pest monitoring",
        },
        {
            "name": "Beans",
            "description": "A legume crop grown for its protein-rich edible seeds.",
            "growing_duration": 90,
            "suitable_temperature": "Varies by variety",
            "rainfall_requirements": "Moderate, well-distributed rainfall",
            "soil_requirements": "Well-drained soil",
            "water_requirements": "Consistent moisture without waterlogging",
            "management_practices": "Weed control, suitable spacing and disease monitoring",
        },
        {
            "name": "Sorghum",
            "description": "A cereal crop used for food, feed and other agricultural purposes.",
            "growing_duration": 110,
            "suitable_temperature": "Generally suited to warm conditions",
            "rainfall_requirements": "Can tolerate relatively dry conditions",
            "soil_requirements": "Adaptable to several soil types with suitable drainage",
            "water_requirements": "Relatively drought tolerant once established",
            "management_practices": "Timely planting, weed control and bird management",
        },
        {
            "name": "Green Grams",
            "description": "A short-duration legume also known as mung bean.",
            "growing_duration": 75,
            "suitable_temperature": "Generally suited to warm conditions",
            "rainfall_requirements": "Moderate rainfall with limited waterlogging",
            "soil_requirements": "Well-drained soil",
            "water_requirements": "Moderate moisture",
            "management_practices": "Timely planting, weed control and pest monitoring",
        },
        {
            "name": "Irish Potatoes",
            "description": "A tuber crop grown for human consumption.",
            "growing_duration": 110,
            "suitable_temperature": "Generally suited to relatively cool conditions",
            "rainfall_requirements": "Adequate and well-distributed moisture",
            "soil_requirements": "Loose, fertile and well-drained soil",
            "water_requirements": "Consistent moisture during tuber development",
            "management_practices": "Certified seed selection, earthing up and disease monitoring",
        },
    ]

    for data in sample_crops:
        crop, created = get_or_create(
            Crop,
            {"name": data["name"]},
            {
                key: value
                for key, value in data.items()
                if key != "name"
            },
        )

        crops[crop.name] = crop

        print(f"{'Created' if created else 'Found'} crop: {crop.name}")

    return crops


def seed_sources():
    sources = {}

    sample_sources = [
        {
            "organisation": "Food and Agriculture Organization (FAO)",
            "title": "GIEWS Kenya Country Brief",
            "url": "https://www.fao.org/giews/countrybrief/country.jsp?code=KEN",
            "notes": (
                "FAO country-level food security and agricultural "
                "information. Consult the relevant publication before "
                "using it to verify a specific crop calendar."
            ),
        },
        {
            "organisation": "Kenya Agricultural and Livestock Research Organization (KALRO)",
            "title": "KALRO Research and Agricultural Resources",
            "url": "https://www.kalro.org/",
            "notes": (
                "Institutional research and agricultural information portal. "
                "A specific supporting publication must be identified "
                "before a calendar entry can be marked verified."
            ),
        },
        {
            "organisation": "World Bank",
            "title": "Kenya Agriculture and Food Security Resources",
            "url": "https://www.worldbank.org/en/country/kenya",
            "notes": (
                "Institutional country resources. This general landing page "
                "is not itself proof of a particular planting window."
            ),
        },
    ]

    for data in sample_sources:
        source, created = get_or_create(
            Source,
            {
                "organisation": data["organisation"],
                "title": data["title"],
            },
            {
                "url": data["url"],
                "notes": data["notes"],
                "accessed_date": date(2026, 11, 23),
            },
        )

        sources[source.organisation] = source

        print(f"{'Created' if created else 'Found'} source: {source.title}")

    return sources


def seed_crop_calendars(crops, sources):
    sample_calendars = [
        {
            "crop": "Maize",
            "county": "Nakuru",
            "subcounty": None,
            "zone": "Highland",
            "season": "Long rains",
            "production_system": "Rain-fed",
            "planting_window": "March-April (illustrative)",
            "harvest_window": "July-September (illustrative)",
            "source": "Food and Agriculture Organization (FAO)",
        },
        {
            "crop": "Beans",
            "county": "Nakuru",
            "subcounty": None,
            "zone": "Highland",
            "season": "Long rains",
            "production_system": "Rain-fed",
            "planting_window": "March-April (illustrative)",
            "harvest_window": "June-August (illustrative)",
            "source": "Kenya Agricultural and Livestock Research Organization (KALRO)",
        },
        {
            "crop": "Sorghum",
            "county": "Kitui",
            "subcounty": None,
            "zone": "Semi-arid",
            "season": "Short rains",
            "production_system": "Rain-fed",
            "planting_window": "October-November (illustrative)",
            "harvest_window": "January-February (illustrative)",
            "source": "Food and Agriculture Organization (FAO)",
        },
        {
            "crop": "Green Grams",
            "county": "Kitui",
            "subcounty": None,
            "zone": "Semi-arid",
            "season": "Short rains",
            "production_system": "Rain-fed",
            "planting_window": "October-November (illustrative)",
            "harvest_window": "January-February (illustrative)",
            "source": "Kenya Agricultural and Livestock Research Organization (KALRO)",
        },
        {
            "crop": "Irish Potatoes",
            "county": "Nakuru",
            "subcounty": None,
            "zone": "Highland",
            "season": "Long rains",
            "production_system": "Rain-fed",
            "planting_window": "March-April (illustrative)",
            "harvest_window": "July-August (illustrative)",
            "source": "World Bank",
        },
    ]

    for data in sample_calendars:
        crop = crops[data["crop"]]
        source = sources[data["source"]]

        calendar, created = get_or_create(
            CropCalendar,
            {
                "crop_id": crop.id,
                "county": data["county"],
                "season": data["season"],
                "source_id": source.id,
            },
            {
                "subcounty": data["subcounty"],
                "agroecological_zone": data["zone"],
                "production_system": data["production_system"],
                "planting_window": data["planting_window"],
                "harvest_window": data["harvest_window"],
                "source_reference": source.title,
                "verification_status": "unverified",
                "notes": (
                    "Illustrative demonstration record only. "
                    "Planting and harvesting windows have not been "
                    "independently verified for this location. "
                    "Do not use as confirmed farming advice."
                ),
            },
        )

        print(
            f"{'Created' if created else 'Found'} calendar: "
            f"{crop.name} - {data['county']}"
        )


def seed_planting_plans(farms, crops):
    sample_plans = [
        {
            "farm": "Green Valley Farm",
            "crop": "Maize",
            "season": "Long rains",
            "planting_date": date(2026, 3, 15),
            "expected_harvest_date": date(2026, 8, 15),
            "acreage": 2.5,
            "status": "harvested",
            "notes": "Demonstration planting plan.",
        },
        {
            "farm": "Sunrise Farm",
            "crop": "Beans",
            "season": "Long rains",
            "planting_date": date(2026, 3, 20),
            "expected_harvest_date": date(2026, 7, 1),
            "acreage": 1.5,
            "status": "harvested",
            "notes": "Demonstration planting plan.",
        },
        {
            "farm": "Eastern Harvest Farm",
            "crop": "Green Grams",
            "season": "Short rains",
            "planting_date": date(2026, 10, 20),
            "expected_harvest_date": date(2027, 1, 10),
            "acreage": 1.0,
            "status": "planted",
            "notes": "Demonstration planting plan.",
        },
    ]

    for data in sample_plans:
        farm = farms[data["farm"]]
        crop = crops[data["crop"]]

        plan, created = get_or_create(
            PlantingPlan,
            {
                "farm_id": farm.id,
                "crop_id": crop.id,
                "season": data["season"],
                "planting_date": data["planting_date"],
            },
            {
                "expected_harvest_date": data["expected_harvest_date"],
                "acreage": data["acreage"],
                "status": data["status"],
                "notes": data["notes"],
            },
        )

        print(
            f"{'Created' if created else 'Found'} planting plan: "
            f"{crop.name} - {farm.name}"
        )


def seed_database():
    try:
        print("\nStarting AgriCast database seeding...\n")

        users = seed_users()
        farms = seed_farms(users)
        crops = seed_crops()
        sources = seed_sources()

        seed_crop_calendars(crops, sources)
        seed_planting_plans(farms, crops)

        db.session.commit()

        print("\nAgriCast database seeding completed successfully.")

    except Exception:
        db.session.rollback()
        print("\nSeeding failed. All pending changes have been rolled back.")
        raise


if __name__ == "__main__":
    app = create_app()

    with app.app_context():
        seed_database()
