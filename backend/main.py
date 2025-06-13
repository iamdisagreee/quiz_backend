from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.auth import views as auth
from backend.quiz import views as quiz

app = FastAPI(
    title="Quiz Backend API",
    description="API для системы квизов",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app_v1 = FastAPI()

app_v1.include_router(auth.router)
app_v1.include_router(quiz.router)

app.mount("/api/v1", app_v1)

app.mount("/", StaticFiles(directory="./frontend", html=True), name="static")
