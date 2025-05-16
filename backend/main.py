from fastapi import FastAPI
from backend.routers import auth

app = FastAPI()
app_v1 = FastAPI()

app_v1.include_router(auth.router)
app.mount("/v1", app_v1)
