from flask import jsonify

from app.routes.auth import login_required

def error_response(message, status):
	return jsonify({"error": message}), status


def validation_error(errors):
	return jsonify({
		"error": "Validation failed",
		"details": errors,
	}), 400

def invalid_body_response():
	return error_response("Send a valid JSON object", 400)

def get_json_object():
	from flask import request

	data = request.get_json(silent=True)

	if not isinstance(data, dict):
		return None
	
	return data

def clean_string(value, max_length, required):
	if not isinstance(value, str):
		return None, "Must be text"
	
	value = value.strip()
	
	if required and not value:
		return None, "This field is required"
	
	if len(value) > max_length:
		return None, f"Must not exceed {max_length} characters"
	
	return value or None, None

def parse_positive_int(value):
	try:
		number = int(value)
	except (TypeError, ValueError):
		return None
	
	if number < 1:
		return None
	
	return number
