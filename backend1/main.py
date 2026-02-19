from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from settings import settings
import user
import board
import auth
import home
import upload

origins = [ settings.react_url ]

app = FastAPI()


app.add_middleware(

  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


apis = [  upload.router, user.router, board.router, auth.router, home.router ]

for router in apis:
  app.include_router(router)
  