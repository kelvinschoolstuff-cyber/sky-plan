def farm_to_dict(farm):
    return {
        "id": farm.id,
        "name": farm.name,
        "location": farm.location,
        "county": farm.county,
        "agroecological_zone": farm.agroecological_zone,
    }

def crop_to_dict(crop):
    return {
        "id": crop.id,
        "name": crop.name,
        "description": crop.description,
        "growing_duration": crop.growing_duration,
        "suitable_temperature": crop.suitable_temperature,
        "rainfall_requirements": crop.rainfall_requirements,
        "soil_requirements": crop.soil_requirements,
        "water_requirements": crop.water_requirements,
        "management_practices": crop.management_practices,
        "disclaimer": "This information is general guidance and should be adapted to local conditions."
    }

def source_to_dict(source):
    return {
        "id": source.id,
        "organisation": source.organisation,
        "title": source.title,
        "url": source.url,
        "licence": source.licence,
        "published_date": (
            source.published_date.isoformat()
            if source.published_date else None
        ),
        "accessed_date": (
            source.accessed_date.isoformat()
            if source.accessed_date else None
        ),
        "notes": source.notes,
    }

def crop_calendar_to_dict(calendar):
    return {
        "id": calendar.id,
        "crop_id": calendar.crop_id,
        "crop_name": calendar.crop.name if calendar.crop else None,
        "county": calendar.county,
        "subcounty": calendar.subcounty,
        "agroecological_zone": calendar.agroecological_zone,
        "season": calendar.season,
        "production_system": calendar.production_system,
        "planting_window": calendar.planting_window,
        "harvest_window": calendar.harvest_window,
        "verification_status": calendar.verification_status,
        "reviewed_at":(
            calendar.reviewed_at.isoformat()
            if calendar.reviewed_at else None
        ),
        "notes":calendar.notes,
        "source_id": calendar.source_id,
        "source": {
            "id": calendar.source.id,
            "title": calendar.source.title,
            "organisation": calendar.source.organisation,
        } if calendar.source else None,
    }