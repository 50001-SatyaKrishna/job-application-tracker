from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_user():
    email = f"pytest_{uuid4().hex}@gmail.com"

    response = client.post(
        "/users/",
        json={
            "name": "Test User",
            "email": email,
            "password": "TestPassword123"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test User"
    assert data["email"] == email
    assert "password_hash" not in data

def test_user_cannot_access_another_users_profile():
    from uuid import uuid4

    # Create User 1
    email1 = f"pytest_{uuid4().hex}@gmail.com"

    response = client.post(
        "/users/",
        json={
            "name": "User One",
            "email": email1,
            "password": "TestPassword123"
        }
    )

    assert response.status_code == 200
    user1_id = response.json()["id"]

    # Create User 2
    email2 = f"pytest_{uuid4().hex}@gmail.com"

    response = client.post(
        "/users/",
        json={
            "name": "User Two",
            "email": email2,
            "password": "TestPassword123"
        }
    )

    assert response.status_code == 200

    # Login User 2
    response = client.post(
        "/login",
        json={
            "email": email2,
            "password": "TestPassword123"
        }
    )

    assert response.status_code == 200

    token2 = response.json()["access_token"]

    # User 2 tries to access User 1's profile
    response = client.get(
        f"/users/{user1_id}",
        headers={
            "Authorization": f"Bearer {token2}"
        }
    )

    assert response.status_code == 403