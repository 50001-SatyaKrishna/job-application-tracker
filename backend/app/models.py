from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date, datetime, timezone

from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100),nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255),nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

class Job(Base):
    __tablename__ = "job_applications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    job_title: Mapped[str] = mapped_column(String(100),nullable=False)
    company_name: Mapped[str] = mapped_column(String(100),nullable=False)
    job_url: Mapped[str] = mapped_column(String(255),nullable=False)
    location: Mapped[str] = mapped_column(String(100),nullable=False)
    applied_date: Mapped[date] = mapped_column(nullable=False)
    salary: Mapped[float | None] = mapped_column(nullable=True)
    status: Mapped[str] = mapped_column(String(50),nullable=False)
    current_round: Mapped[int | None] = mapped_column(nullable=True)
    interview_date: Mapped[datetime | None] = mapped_column(nullable=True)
    offer_status: Mapped[str | None] = mapped_column(String(50),nullable=True)
    remarks: Mapped[str | None] = mapped_column(String(255),nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))