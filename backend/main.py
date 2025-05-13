from fastapi import FastAPI

from backend.config import load_config
from backend.routers import auth

app = FastAPI()
app_v1 = FastAPI()
config = load_config()

app_v1.include_router(auth.router_v1)
app.mount("/v1", app_v1)
