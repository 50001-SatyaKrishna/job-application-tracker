from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import jobs, user,auth


app = FastAPI()

origins = ["https://www.google.com","http://localhost:3000","https://job-application-tracker-frontend-mc98.onrender.com", "http://localhost:5173", "http://localhost:8000", "http://localhost:8080", "http://localhost:8001", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(auth.router)
app.include_router(jobs.router)
@app.get("/")
def root():
    return {"message": "Hello World"}