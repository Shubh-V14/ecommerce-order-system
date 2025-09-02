"""
Test Configuration
Pytest fixtures and test setup
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.models.user import User
from app.core.security import security_manager
from main import app

# Test database URL - use in-memory database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine"""
    # Import all models to ensure they're registered
    from app.models import user, order  # noqa
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create test database session"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with database override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    from app.models.user import UserRole
    
    # Create user directly with known password hash
    password_hash = security_manager.get_password_hash("testpass123")
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=password_hash,
        role=UserRole.CUSTOMER,
        full_name="Test User",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Verify the password works
    assert security_manager.verify_password("testpass123", user.hashed_password)
    return user


@pytest.fixture
def auth_headers(test_user, db_session):
    """Create authentication headers for test user"""
    from app.services.auth_service import AuthService
    
    auth_service = AuthService(db_session)
    token = auth_service.create_access_token(test_user)
    
    return {"Authorization": f"Bearer {token.access_token}"}
