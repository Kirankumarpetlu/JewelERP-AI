from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"


@lru_cache(maxsize=1)
def load_app_env() -> Path:
    """Load backend environment variables from backend/.env once."""
    load_dotenv(ENV_PATH)
    return ENV_PATH
