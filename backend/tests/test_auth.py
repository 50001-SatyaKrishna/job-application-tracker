from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_login_user():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    register_response = client.post(
        "/users/",
        json={
            "name": "Login Test User",
            "email": email,
            "password": password
        }
    )

    assert register_response.status_code == 200

    # Login
    login_response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert login_response.status_code == 200

    data = login_response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_duplicate_names_are_allowed():
    first_name = f"pytest_user_{uuid4().hex[:8]}"
    second_name = first_name
    first_email = f"{uuid4().hex[:8]}@gmail.com"
    second_email = f"{uuid4().hex[:8]}@gmail.com"
    password = "TestPassword123"

    first_response = client.post(
        "/users/",
        json={
            "name": first_name,
            "email": first_email,
            "password": password
        }
    )

    second_response = client.post(
        "/users/",
        json={
            "name": second_name,
            "email": second_email,
            "password": password
        }
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200

def test_login_with_wrong_password():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    register_response = client.post(
        "/users/",
        json={
            "name": "Wrong Password User",
            "email": email,
            "password": password
        }
    )

    assert register_response.status_code == 200

    # Try logging in with wrong password
    login_response = client.post(
        "/login",
        json={
            "email": email,
            "password": "WrongPassword123"
        }
    )

    assert login_response.status_code == 401
    assert login_response.json()["detail"] == "Invalid email or password"

def test_get_current_user():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    register_response = client.post(
        "/users/",
        json={
            "name": "Protected User",
            "email": email,
            "password": password
        }
    )

    assert register_response.status_code == 200

    # Login
    login_response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    # Access protected endpoint
    response = client.get(
        "/users/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Protected User"
    assert data["email"] == email

def test_get_current_user_without_token():
    response = client.get("/users/me")

    assert response.status_code == 401