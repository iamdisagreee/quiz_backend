from fastapi import FastAPI
from backend.auth import views as auth
from backend.quiz import views as quiz

app = FastAPI()
app_v1 = FastAPI()

app_v1.include_router(auth.router)
app_v1.include_router(quiz.router)

app.mount("/v1", app_v1)
