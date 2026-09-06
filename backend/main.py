from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.routers import users, voices, generations, billing, admin
import os

app = FastAPI(title="Voice Clone SaaS API")

# Configure CORS
# NOTE: allow_credentials=True is incompatible with allow_origins=["*"].
# We must list allowed origins explicitly.
ALLOWED_ORIGINS = [
    "https://voice-clone-lilac.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(voices.router, prefix="/api/voices", tags=["Voices"])
app.include_router(generations.router, prefix="/api/generations", tags=["Generations"])
app.include_router(billing.router, prefix="/api/billing", tags=["Billing"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

from fastapi.responses import FileResponse

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Mount the React frontend directory (Production Build)
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

# Serve assets directly
app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")

# Catch-all route for Single Page Application (SPA)
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    # If the file exists physically (like vite.svg), serve it
    file_path = os.path.join(frontend_path, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # Otherwise, fallback to index.html for React Router
    return FileResponse(os.path.join(frontend_path, "index.html"))
