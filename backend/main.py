from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.auth import views as auth
from backend.users import views as users
from backend.quizzes import views as quizzes

app = FastAPI(
    title="Quiz Backend API",
    description="API для системы квизов",
    version="1.0.0"
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(quizzes.router, prefix="/api/v1")

app.mount("/", StaticFiles(directory="./frontend", html=True), name="static")
