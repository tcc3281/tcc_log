from fastapi import FastAPI
from .database import engine, Base

# Import models to register metadata
from . import models
from .api import users, topics, entries, files, links, tags, auth

app = FastAPI(title="Journal API")

@app.on_event("startup")
def on_startup():
    # Create tables
    Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Journal API"}

app.include_router(users.router)
app.include_router(topics.router)
app.include_router(entries.router)
app.include_router(files.router)
app.include_router(links.router)
app.include_router(tags.router)
app.include_router(auth.router)

# TODO: include routers for users, topics, entries, files, links, tags 