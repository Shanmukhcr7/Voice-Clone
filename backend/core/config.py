import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ENV: str = "development"
    SECRET_KEY: str = "secret"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Cloudflare R2
    R2_ENDPOINT_URL: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_URL: str = ""
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "serviceaccounts.json"
    
    # Payment
    PAYMENT_KEY_ID: str = ""
    PAYMENT_KEY_SECRET: str = ""
    PAYMENT_WEBHOOK_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
