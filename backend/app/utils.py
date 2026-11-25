from functools import wraps

from flask import g, jsonify, session

from app.extensions import db
from app.models import User

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

def login_required(view):
	@wraps(view)
	def wrapped_view(*args, **kwargs):
		user_id = session.get("user_id")

		if isinstance(user_id, bool) or not isinstance(user_id, int):
			return error_response("Authentication required", 401)
		
		user = db.session.get(User, user_id)

		if user is None:
			session.clear()
			return error_response("Authentication required", 401)
		
		g.current_user = user

		return view(*args, **kwargs)
	
	return wrapped_view
