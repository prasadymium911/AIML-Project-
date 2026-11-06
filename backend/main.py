"""
Entrypoint alias for running with:
    uvicorn backend.main:app --reload
"""
from backend.app import app

__all__ = ["app"]

