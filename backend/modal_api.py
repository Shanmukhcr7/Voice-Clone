import modal
from backend.main import app

modal_app = modal.App("voxaura-api")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "fastapi",
        "uvicorn",
        "firebase-admin",
        "google-cloud-firestore",
        "boto3",
        "python-multipart",
        "requests"
    )
)

@modal_app.function(
    image=image,
    secrets=[modal.Secret.from_name("voxaura-secrets")],
    keep_warm=1
)
@modal.asgi_app()
def fastapi_app():
    return app
