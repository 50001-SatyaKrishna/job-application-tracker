from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import date,datetime
from enum import Enum

class JobStatus(str, Enum):
    APPLIED = "Applied"
    INTERVIEWING = "Interviewing"
    OFFERED = "Offered"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    WITHDRAWN = "Withdrawn"

class OfferStatus(str, Enum):
    NONE = "None"
    OFFERED = "Offered"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

    
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class JobCreate(BaseModel):
    job_title: str
    company_name: str
    job_url: str
    location: str
    applied_date: date
    salary: float | None = None
    status: JobStatus
    current_round: int | None = None
    interview_date: datetime | None = None
    offer_status:  OfferStatus | None = None
    remarks: str | None = None

class JobResponse(BaseModel):
    id: int
    user_id: int
    job_title: str
    company_name: str
    job_url: str
    location: str
    applied_date: date
    salary: float | None = None
    status: JobStatus
    current_round: int | None = None
    interview_date: datetime | None = None
    offer_status: OfferStatus | None = None
    remarks: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobUpdate(BaseModel):
    job_title: str | None = None
    company_name: str | None = None
    job_url: str | None = None
    location: str | None = None
    applied_date: date | None = None
    salary: float | None = None
    status: JobStatus | None = None
    current_round: int | None = None
    interview_date: datetime | None = None
    offer_status: OfferStatus | None = None
    remarks: str | None = None