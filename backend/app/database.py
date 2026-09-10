from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

SQLALCHEMY_DATABASE_URL = settings.sqlalchemy_database_url

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(
        autoflush=False,
        bind=engine
    )

Base = declarative_base()

# try:
#     with engine.connect() as connection:
#         print("✅ Database connection successful!")
# except Exception as e:
#     print("❌ Database connection failed!")
#     print(e)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()