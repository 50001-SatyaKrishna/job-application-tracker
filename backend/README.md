# Backend

This is the FastAPI backend for the Job Application Tracker. It handles authentication, user management, job CRUD operations, and the database layer for the full application.

## Tech stack

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL / configured database backend
- JWT authentication
- Alembic for migrations

## Prerequisites

- Python 3.11 or newer
- A configured database
- A virtual environment

## Create and activate a virtual environment

```bash
python -m venv venv
```

On Windows:

```bash
venv\Scripts\activate
```

On macOS/Linux:

```bash
source venv/bin/activate
```

## Install dependencies

```bash
pip install -r requirements.txt
```

## Environment configuration

The app reads configuration values from a `.env` file in the backend folder. Make sure the file includes the required database and JWT settings.

Example structure:

```env
sqlalchemy_database_url=postgresql://username:password@localhost:5432/job_tracker
secret_key=your_secret_key
access_token_expire_minutes=30
algorithm=HS256
database_hostname=localhost
database_port=5432
database_password=your_password
database_name=job_tracker
database_username=your_username
```

## Run the app

```bash
uvicorn app.main:app --reload
```

The API will typically be available at:

- http://localhost:8000

## Run tests

```bash
pytest
```

## Database migrations

This project uses Alembic.

To create a new migration:

```bash
alembic revision --autogenerate -m "describe your change"
```

To apply migrations:

```bash
alembic upgrade head
```

## Project structure

```text
app/
  auth/
  routers/
  __init__.py
  config.py
  database.py
  main.py
  models.py
  schemas.py
  security.py
alembic/
  versions/
  env.py
  README
  script.py.mako
```

## Notes

This backend is meant to work with the frontend in the `frontend/` folder. Start the backend before testing login, job creation, and API-driven table updates.
