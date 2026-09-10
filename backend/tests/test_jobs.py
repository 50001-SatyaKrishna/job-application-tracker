from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_job():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    register_response = client.post(
        "/users/",
        json={
            "name": "Job Test User",
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

    # Create job
    job_response = client.post(
        "/jobs/",
        headers={
            "Authorization": f"Bearer {token}"
        },
        json={
            "job_title": "Backend Developer",
            "company_name": "Test Company",
            "job_url": "https://example.com/job",
            "location": "Hyderabad",
            "applied_date": "2026-09-10",
            "salary": 600000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "Testing job creation"
        }
    )

    assert job_response.status_code == 200

    data = job_response.json()

    assert data["job_title"] == "Backend Developer"
    assert data["company_name"] == "Test Company"
    assert data["location"] == "Hyderabad"
    assert data["salary"] == 600000
    assert data["status"] == "Applied"
    assert data["remarks"] == "Testing job creation"

def test_get_job():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    register_response = client.post(
        "/users/",
        json={
            "name": "Get Job User",
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

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create a job
    job_response = client.post(
        "/jobs/",
        headers=headers,
        json={
            "job_title": "Python Developer",
            "company_name": "Test Company",
            "job_url": "https://example.com/job",
            "location": "Bangalore",
            "applied_date": "2026-09-10",
            "salary": 700000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "Testing get job"
        }
    )

    assert job_response.status_code == 200

    job_id = job_response.json()["id"]

    # Get the job
    response = client.get(
        f"/jobs/{job_id}",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == job_id
    assert data["job_title"] == "Python Developer"
    assert data["company_name"] == "Test Company"

def test_user_cannot_access_another_users_job():
    # -------------------------
    # Create User 1
    # -------------------------
    email1 = f"pytest_{uuid4().hex}@gmail.com"
    password1 = "TestPassword123"

    response = client.post(
        "/users/",
        json={
            "name": "User One",
            "email": email1,
            "password": password1
        }
    )

    assert response.status_code == 200

    # Login User 1
    response = client.post(
        "/login",
        json={
            "email": email1,
            "password": password1
        }
    )

    assert response.status_code == 200

    token1 = response.json()["access_token"]

    headers1 = {
        "Authorization": f"Bearer {token1}"
    }

    # -------------------------
    # User 1 creates a job
    # -------------------------
    response = client.post(
        "/jobs/",
        headers=headers1,
        json={
            "job_title": "Private Job",
            "company_name": "Private Company",
            "job_url": "https://example.com/job",
            "location": "Hyderabad",
            "applied_date": "2026-09-10",
            "salary": 500000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "User 1 private job"
        }
    )

    assert response.status_code == 200

    job_id = response.json()["id"]

    # -------------------------
    # Create User 2
    # -------------------------
    email2 = f"pytest_{uuid4().hex}@gmail.com"
    password2 = "TestPassword123"

    response = client.post(
        "/users/",
        json={
            "name": "User Two",
            "email": email2,
            "password": password2
        }
    )

    assert response.status_code == 200

    # Login User 2
    response = client.post(
        "/login",
        json={
            "email": email2,
            "password": password2
        }
    )

    assert response.status_code == 200

    token2 = response.json()["access_token"]

    headers2 = {
        "Authorization": f"Bearer {token2}"
    }

    # -------------------------
    # User 2 tries to access
    # User 1's job
    # -------------------------
    response = client.get(
        f"/jobs/{job_id}",
        headers=headers2
    )

    assert response.status_code == 403

def test_update_job():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    response = client.post(
        "/users/",
        json={
            "name": "Update Job User",
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    # Login
    response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create job
    response = client.post(
        "/jobs/",
        headers=headers,
        json={
            "job_title": "Backend Developer",
            "company_name": "Old Company",
            "job_url": "https://example.com/job",
            "location": "Hyderabad",
            "applied_date": "2026-09-10",
            "salary": 600000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "Initial remarks"
        }
    )

    assert response.status_code == 200

    job_id = response.json()["id"]

    # Update job
    response = client.patch(
        f"/jobs/{job_id}",
        headers=headers,
        json={
            "company_name": "New Company",
            "salary": 800000,
            "status": "Interviewing",
            "remarks": "Passed first round"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == job_id
    assert data["company_name"] == "New Company"
    assert data["salary"] == 800000
    assert data["status"] == "Interviewing"
    assert data["remarks"] == "Passed first round"

def test_delete_job():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    response = client.post(
        "/users/",
        json={
            "name": "Delete Job User",
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    # Login
    response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create job
    response = client.post(
        "/jobs/",
        headers=headers,
        json={
            "job_title": "Delete Me",
            "company_name": "Test Company",
            "job_url": "https://example.com/job",
            "location": "Hyderabad",
            "applied_date": "2026-09-10",
            "salary": 500000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "This job will be deleted"
        }
    )

    assert response.status_code == 200

    job_id = response.json()["id"]

    # Delete job
    response = client.delete(
        f"/jobs/{job_id}",
        headers=headers
    )

    assert response.status_code == 204

    # Confirm job no longer exists
    response = client.get(
        f"/jobs/{job_id}",
        headers=headers
    )

    assert response.status_code == 404

def test_get_jobs():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    response = client.post(
        "/users/",
        json={
            "name": "List Jobs User",
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    # Login
    response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create first job
    response = client.post(
        "/jobs/",
        headers=headers,
        json={
            "job_title": "Backend Developer",
            "company_name": "Company A",
            "job_url": "https://example.com/a",
            "location": "Hyderabad",
            "applied_date": "2026-09-10",
            "salary": 600000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "First job"
        }
    )

    assert response.status_code == 200

    # Create second job
    response = client.post(
        "/jobs/",
        headers=headers,
        json={
            "job_title": "Python Developer",
            "company_name": "Company B",
            "job_url": "https://example.com/b",
            "location": "Bangalore",
            "applied_date": "2026-09-10",
            "salary": 700000,
            "status": "Interviewing",
            "current_round": 2,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "Second job"
        }
    )

    assert response.status_code == 200

    # Get all jobs
    response = client.get(
        "/jobs/",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2

    assert data[0]["job_title"] == "Python Developer"
    assert data[1]["job_title"] == "Backend Developer"

def test_get_jobs_with_status_filter():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    response = client.post(
        "/users/",
        json={
            "name": "Filter Test User",
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    # Login
    response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create Applied job
    response = client.post(
        "/jobs/",
        headers=headers,
        json={
            "job_title": "Applied Job",
            "company_name": "Company A",
            "job_url": "https://example.com/a",
            "location": "Hyderabad",
            "applied_date": "2026-09-10",
            "salary": 600000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": None
        }
    )

    assert response.status_code == 200

    # Create Interviewing job
    response = client.post(
        "/jobs/",
        headers=headers,
        json={
            "job_title": "Interview Job",
            "company_name": "Company B",
            "job_url": "https://example.com/b",
            "location": "Bangalore",
            "applied_date": "2026-09-10",
            "salary": 700000,
            "status": "Interviewing",
            "current_round": 2,
            "interview_date": None,
            "offer_status": "None",
            "remarks": None
        }
    )

    assert response.status_code == 200

    # Filter by Interviewing
    response = client.get(
        "/jobs/?status=Interviewing",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["job_title"] == "Interview Job"
    assert data[0]["status"] == "Interviewing"

def test_get_jobs_with_pagination():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    response = client.post(
        "/users/",
        json={
            "name": "Pagination User",
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    # Login
    response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Create 3 jobs
    for i in range(3):
        response = client.post(
            "/jobs/",
            headers=headers,
            json={
                "job_title": f"Job {i + 1}",
                "company_name": f"Company {i + 1}",
                "job_url": "https://example.com/job",
                "location": "Hyderabad",
                "applied_date": "2026-09-10",
                "salary": 500000,
                "status": "Applied",
                "current_round": None,
                "interview_date": None,
                "offer_status": "None",
                "remarks": None
            }
        )

        assert response.status_code == 200

    # Get first 2 jobs
    response = client.get(
        "/jobs/?limit=2&offset=0",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[0]["job_title"] == "Job 3"
    assert data[1]["job_title"] == "Job 2"

    # Skip the first 2 jobs and get the next one
    response = client.get(
        "/jobs/?limit=2&offset=2",
        headers=headers
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["job_title"] == "Job 1"

def test_get_nonexistent_job():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    response = client.post(
        "/users/",
        json={
            "name": "Error Test User",
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    # Login
    response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    # Try to get a job that doesn't exist
    response = client.get(
        "/jobs/999999999",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Job Application with ID 999999999 does not exist"
    )

def test_invalid_pagination():
    email = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    # Create user
    response = client.post(
        "/users/",
        json={
            "name": "Pagination Error User",
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    # Login
    response = client.post(
        "/login",
        json={
            "email": email,
            "password": password
        }
    )

    assert response.status_code == 200

    token = response.json()["access_token"]

    # limit must be greater than 0
    response = client.get(
        "/jobs/?limit=0",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 422

def test_user_cannot_update_another_users_job():
    # Create User 1
    email1 = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    response = client.post(
        "/users/",
        json={
            "name": "User One",
            "email": email1,
            "password": password
        }
    )
    assert response.status_code == 200

    # Login User 1
    response = client.post(
        "/login",
        json={
            "email": email1,
            "password": password
        }
    )
    assert response.status_code == 200

    token1 = response.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # User 1 creates a job
    response = client.post(
        "/jobs/",
        headers=headers1,
        json={
            "job_title": "Original Job",
            "company_name": "Original Company",
            "job_url": "https://example.com/job",
            "location": "Hyderabad",
            "applied_date": "2026-09-10",
            "salary": 600000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "Original"
        }
    )
    assert response.status_code == 200

    job_id = response.json()["id"]

    # Create User 2
    email2 = f"pytest_{uuid4().hex}@gmail.com"

    response = client.post(
        "/users/",
        json={
            "name": "User Two",
            "email": email2,
            "password": password
        }
    )
    assert response.status_code == 200

    # Login User 2
    response = client.post(
        "/login",
        json={
            "email": email2,
            "password": password
        }
    )
    assert response.status_code == 200

    token2 = response.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 2 tries to update User 1's job
    response = client.patch(
        f"/jobs/{job_id}",
        headers=headers2,
        json={
            "company_name": "Hacked Company",
            "salary": 999999
        }
    )

    assert response.status_code == 403

def test_user_cannot_delete_another_users_job():
    # Create User 1
    email1 = f"pytest_{uuid4().hex}@gmail.com"
    password = "TestPassword123"

    response = client.post(
        "/users/",
        json={
            "name": "User One",
            "email": email1,
            "password": password
        }
    )
    assert response.status_code == 200

    # Login User 1
    response = client.post(
        "/login",
        json={
            "email": email1,
            "password": password
        }
    )
    assert response.status_code == 200

    token1 = response.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # User 1 creates a job
    response = client.post(
        "/jobs/",
        headers=headers1,
        json={
            "job_title": "Protected Job",
            "company_name": "Private Company",
            "job_url": "https://example.com/job",
            "location": "Hyderabad",
            "applied_date": "2026-09-10",
            "salary": 600000,
            "status": "Applied",
            "current_round": None,
            "interview_date": None,
            "offer_status": "None",
            "remarks": "Must not be deleted"
        }
    )
    assert response.status_code == 200

    job_id = response.json()["id"]

    # Create User 2
    email2 = f"pytest_{uuid4().hex}@gmail.com"

    response = client.post(
        "/users/",
        json={
            "name": "User Two",
            "email": email2,
            "password": password
        }
    )
    assert response.status_code == 200

    # Login User 2
    response = client.post(
        "/login",
        json={
            "email": email2,
            "password": password
        }
    )
    assert response.status_code == 200

    token2 = response.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 2 tries to delete User 1's job
    response = client.delete(
        f"/jobs/{job_id}",
        headers=headers2
    )

    assert response.status_code == 403

    # Verify the job still exists for User 1
    response = client.get(
        f"/jobs/{job_id}",
        headers=headers1
    )

    assert response.status_code == 200