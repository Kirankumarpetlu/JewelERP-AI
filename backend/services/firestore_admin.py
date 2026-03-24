import json
import os
from pathlib import Path
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore

from config import load_app_env

load_app_env()

_firestore_client = None


def _load_service_account_credential():
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "").strip()

    if service_account_json:
      return credentials.Certificate(json.loads(service_account_json))

    if service_account_path:
      resolved_path = Path(service_account_path)
      if not resolved_path.is_absolute():
        resolved_path = (Path(__file__).resolve().parents[1] / resolved_path).resolve()
      if resolved_path.exists():
        return credentials.Certificate(str(resolved_path))

    return None


def initialize_firestore_admin() -> bool:
    global _firestore_client

    if _firestore_client is not None:
        return True

    try:
        app = firebase_admin.get_app()
    except ValueError:
        app = None

    try:
        if app is None:
            credential = _load_service_account_credential()
            if credential is None:
                print("[WARN] Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.")
                return False

            options = {}
            project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
            if project_id:
                options["projectId"] = project_id

            app = firebase_admin.initialize_app(credential, options or None)

        _firestore_client = firestore.client(app=app)
        print("[OK] Firebase Admin Firestore connected")
        return True
    except Exception as exc:
        print(f"[WARN] Failed to initialize Firebase Admin Firestore: {exc}")
        _firestore_client = None
        return False


def is_firestore_admin_ready() -> bool:
    return _firestore_client is not None


def get_firestore_admin():
    if _firestore_client is None and not initialize_firestore_admin():
        raise RuntimeError("Firebase Admin Firestore is not configured.")
    return _firestore_client
