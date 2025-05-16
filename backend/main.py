from fastapi import FastAPI
from backend.auth import views

app = FastAPI()
app_v1 = FastAPI()

app_v1.include_router(views.router)

app.mount("/v1", app_v1)
