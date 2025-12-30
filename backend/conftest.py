"""
Pytest configuration file for the backend.
Sets up the pgvector extension for test databases.
"""
import pytest
from django.db import connection


@pytest.fixture(scope="session", autouse=True)
def django_db_setup(django_db_setup, django_db_blocker):
    """
    Ensure pgvector extension is created before running tests.
    This fixture runs once per test session.
    """
    with django_db_blocker.unblock():
        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    yield
