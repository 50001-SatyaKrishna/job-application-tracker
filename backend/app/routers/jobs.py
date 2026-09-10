from fastapi import APIRouter, Depends, HTTPException,Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from .. import models, schemas
from ..auth.oauth2 import get_current_user
from ..database import get_db
router = APIRouter(
    prefix="/jobs",
    tags=["jobs"]
)

@router.post("/",response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_job = models.Job(
        user_id=current_user.id,
        job_title=job.job_title,
        company_name=job.company_name,
        job_url=job.job_url,
        location=job.location,
        applied_date=job.applied_date,
        salary=job.salary,
        status=job.status,
        current_round=job.current_round,
        interview_date=job.interview_date,
        offer_status=job.offer_status,
        remarks=job.remarks
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.get("/{job_id}",response_model=schemas.JobResponse)
def get_job(job_id: int, current_user: models.User = Depends(get_current_user),db: Session = Depends(get_db)):
    statement = select(models.Job).where(models.Job.id == job_id)
    job = db.execute(statement).scalar_one_or_none()
    if job is None:
        raise HTTPException(
            status_code=404,
            detail=f"Job Application with ID {job_id} does not exist"
        )
    if job.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to view this job"
        )
    return job

@router.get("/",response_model=list[schemas.JobResponse])
def get_jobs(
        status: schemas.JobStatus | None = None,
        limit: int = Query(10, gt=0),
        offset: int = Query(0, ge=0),
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
    statement = select(models.Job).where(models.Job.user_id == current_user.id)
    if status is not None:
        statement = statement.where(models.Job.status == status)
    statement = statement.order_by(models.Job.created_at.desc())
    statement = statement.limit(limit).offset(offset)
    jobs = db.execute(statement).scalars().all()
    return jobs

@router.patch("/{job_id}",response_model=schemas.JobResponse)
def update_job(
        job_id: int,
        job: schemas.JobUpdate,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
    statement = select(models.Job).where(models.Job.id == job_id)
    existing_job = db.execute(statement).scalar_one_or_none()
    if existing_job is None:
        raise HTTPException(
            status_code=404,
            detail=f"Job Application with ID {job_id} does not exist"
        )
    if existing_job.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to update this job"
        )
    for key, value in job.model_dump(exclude_unset=True).items():
        setattr(existing_job, key, value)
    db.commit()
    db.refresh(existing_job)
    return existing_job

@router.delete("/{job_id}",status_code=204)
def delete_job(job_id: int, current_user: models.User = Depends(get_current_user),db: Session = Depends(get_db)):
    statement = select(models.Job).where(models.Job.id == job_id)
    existing_job = db.execute(statement).scalar_one_or_none()
    if existing_job is None:
        raise HTTPException(
            status_code=404,
            detail=f"Job Application with ID {job_id} does not exist"
        )
    if existing_job.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to delete this job"
        )
    db.delete(existing_job)
    db.commit()
