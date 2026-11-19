COUNTIES = ["Baringo","Bomet","Bungoma","Busia","Elgeyo-Marakwet","Embu","Garissa","Homa Bay","Isiolo","Kajiado","Kakamega",
"Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu","Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera",
"Marsabit","Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok","Nyamira","Nyandarua","Nyeri","Samburu",
"Siaya","Taita-Taveta","Tana River","Tharaka-Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"]


# How the KALRO/FAO source spells some counties/districts in its area text (only spellings that appear there).
COUNTY_ALIASES = {
    "Trans Nzoia": ["Trans Nzoia", "Trans-Nzoia", "T/Nzoia"], "West Pokot": ["West Pokot", "W/Pokot"],
    "Elgeyo-Marakwet": ["Elgeyo-Marakwet", "Elgeyo Marakwet", "Keiyo/Marakwet", "Keiyo/Markwet"],
    "Murang'a": ["Murang'a", "Muranga"], "Uasin Gishu": ["Uasin Gishu", "UasinGishu"], "Taita-Taveta": ["Taita-Taveta", "Taita Taveta"],
}


def names_for(county: str) -> list[str]:
    return COUNTY_ALIASES.get(county, [county])
