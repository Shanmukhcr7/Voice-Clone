from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import users, voices, generations, billing, admin
import os

app = FastAPI(title="Voice Clone SaaS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set to FRONTEND_URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(voices.router, prefix="/api/voices", tags=["Voices"])
app.include_router(generations.router, prefix="/api/generations", tags=["Generations"])
app.include_router(billing.router, prefix="/api/billing", tags=["Billing"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

# Frontend is served by Vercel / Vite

@app.get("/health")
def health_check():
    return {"status": "ok"}
