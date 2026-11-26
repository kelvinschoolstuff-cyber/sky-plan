import re
from collections.abc import Callable
from functools import wraps
from typing import Any, TypeVar, cast

from flask import Blueprint, current_app, g, jsonify, request, session
from flask.typing import ResponseReturnValue
from flask_session.base import ServerSideSessionInterface
from sqlalchemy.exc import IntegrityError

from app.extensions import bcrypt, db
from app.models import User

bp = Blueprint("auth", __name__, url_prefix="/api")

_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+$")
_MIN_USERNAME_LENGTH = 3
_MAX_USERNAME_LENGTH = 80
_MAX_EMAIL_LENGTH = 120
_MIN_PASSWORD_LENGTH = 8
_MAX_PASSWORD_BYTES = 72

ViewFunction = TypeVar("ViewFunction", bound=Callable[..., ResponseReturnValue])


def _public_user(user: User) -> dict[str, int | str]:
    return {"id": user.id, "username": user.username, "email": user.email}


def _json_body() -> dict[str, Any] | None:
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else None


def _password_fits_bcrypt(password: str) -> bool:
    try:
        return len(password.encode("utf-8")) <= _MAX_PASSWORD_BYTES
    except UnicodeEncodeError:
        return False


def _authenticated_user() -> User | None:
    user_id = session.get("user_id")
    if isinstance(user_id, bool) or not isinstance(user_id, int):
        if "user_id" in session:
            session.clear()
        return None

    user = db.session.get(User, user_id)
    if user is None:
        session.clear()
    return user


def login_required(view: ViewFunction) -> ViewFunction:
    @wraps(view)
    def wrapped(*args: Any, **kwargs: Any) -> ResponseReturnValue:
        user = _authenticated_user()
        if user is None:
            return jsonify(error="Authentication required"), 401
        g.current_user = user
        g.user_id = user.id
        return view(*args, **kwargs)

    return cast(ViewFunction, wrapped)


@bp.post("/signup")
def signup() -> ResponseReturnValue:
    body = _json_body()
    if body is None:
        return jsonify(error="A JSON object is required"), 400

    username = body.get("username")
    email = body.get("email")
    password = body.get("password")
    if not all(isinstance(value, str) for value in (username, email, password)):
        return jsonify(error="Username, email, and password are required"), 400

    username = username.strip()
    email = email.strip().lower()
    if not username or not email or not password:
        return jsonify(error="Username, email, and password are required"), 400
    if (
        not _MIN_USERNAME_LENGTH <= len(username) <= _MAX_USERNAME_LENGTH
        or not _USERNAME_PATTERN.fullmatch(username)
    ):
        return jsonify(error="Username must be 3 to 80 letters, numbers, '.', '_' or '-'"), 400
    if len(email) > _MAX_EMAIL_LENGTH or not _EMAIL_PATTERN.fullmatch(email):
        return jsonify(error="Enter a valid email address"), 400
    if (
        len(password) < _MIN_PASSWORD_LENGTH
        or not _password_fits_bcrypt(password)
    ):
        return jsonify(
            error="Password must be at least 8 characters and no more than 72 UTF-8 bytes"
        ), 400

    if User.query.filter_by(username=username).first() is not None:
        return jsonify(error="Username already exists"), 409
    if User.query.filter_by(email=email).first() is not None:
        return jsonify(error="Email already exists"), 409

    user = User(
        username=username,
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        current_app.logger.info("Signup rejected because a unique user value already exists.")
        return jsonify(error="Username or email already exists"), 409

    return jsonify(user=_public_user(user)), 201


@bp.post("/login")
def login() -> ResponseReturnValue:
    body = _json_body()
    if body is None:
        return jsonify(error="A JSON object is required"), 400

    email = body.get("email")
    password = body.get("password")
    if not isinstance(email, str) or not isinstance(password, str) or not email or not password:
        return jsonify(error="Email and password are required"), 400
    if not _password_fits_bcrypt(password):
        return jsonify(error="Invalid email or password"), 401

    user = User.query.filter_by(email=email.strip().lower()).first()
    if user is None or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify(error="Invalid email or password"), 401

    session.clear()
    session["user_id"] = user.id
    session_interface = current_app.session_interface
    if not isinstance(session_interface, ServerSideSessionInterface):
        raise RuntimeError("Authentication requires Flask-Session server-side sessions")
    session_interface.regenerate(session)
    return jsonify(user=_public_user(user)), 200


@bp.post("/logout")
@login_required
def logout() -> ResponseReturnValue:
    session.clear()
    return jsonify(message="Logged out successfully"), 200


@bp.get("/check_session")
def check_session() -> ResponseReturnValue:
    user = _authenticated_user()
    if user is None:
        return jsonify(authenticated=False), 200
    return jsonify(authenticated=True, data=_public_user(user)), 200
