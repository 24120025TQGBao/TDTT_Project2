import json
from functools import lru_cache
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials, firestore

from .config import get_settings


def _env_file_candidates() -> tuple[Path, ...]:
    return (
        Path(__file__).resolve().parents[1] / ".env" / ".env",
        Path(__file__).resolve().parents[1] / ".env",
        Path(__file__).resolve().parents[2] / ".env",
    )


def _load_service_account_info(settings) -> tuple[credentials.Base, dict]:
    raw_value = settings.firebase_service_account_path.strip()

    if raw_value:
        if raw_value.startswith("{"):
            service_account_info = json.loads(raw_value)
            return credentials.Certificate(service_account_info), service_account_info

        return credentials.Certificate(raw_value), {}

    for env_path in _env_file_candidates():
        if not env_path.is_file():
            continue

        content = env_path.read_text(encoding="utf-8").strip()
        if content.startswith("{"):
            service_account_info = json.loads(content)
            return credentials.Certificate(service_account_info), service_account_info

    raise RuntimeError(
        "Missing Firebase service account credentials. Set "
        "FIREBASE_SERVICE_ACCOUNT_PATH to a JSON file path, set it to a JSON "
        "string, or paste the full JSON into backend/.env/.env."
    )


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    settings = get_settings()

    if firebase_admin._apps:
        return firebase_admin.get_app()

    credential, service_account_info = _load_service_account_info(settings)
    options = {}

    project_id = settings.firebase_project_id or service_account_info.get("project_id")
    if project_id:
        options["projectId"] = project_id

    if settings.firebase_storage_bucket:
        options["storageBucket"] = settings.firebase_storage_bucket

    return firebase_admin.initialize_app(credential, options or None)


def get_firestore_client():
    app = get_firebase_app()
    return firestore.client(app)


def verify_token(id_token: str) -> dict:
    app = get_firebase_app()
    return auth.verify_id_token(id_token, app=app)
