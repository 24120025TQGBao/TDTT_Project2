from functools import lru_cache

import firebase_admin
from firebase_admin import auth, credentials, firestore

from .config import get_settings


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    settings = get_settings()

    if not settings.firebase_service_account_path:
        raise RuntimeError(
            "Missing FIREBASE_SERVICE_ACCOUNT_PATH in backend/.env. "
            "Point it to your Firebase service account JSON file."
        )

    if firebase_admin._apps:
        return firebase_admin.get_app()

    credential = credentials.Certificate(settings.firebase_service_account_path)
    options = {}

    if settings.firebase_project_id:
        options["projectId"] = settings.firebase_project_id
    if settings.firebase_storage_bucket:
        options["storageBucket"] = settings.firebase_storage_bucket

    return firebase_admin.initialize_app(credential, options or None)


def get_firestore_client():
    app = get_firebase_app()
    return firestore.client(app)


def verify_token(id_token: str) -> dict:
    app = get_firebase_app()
    return auth.verify_id_token(id_token, app=app)
