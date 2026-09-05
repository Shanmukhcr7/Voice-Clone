import boto3
from botocore.config import Config
from backend.core.config import settings

class StorageService:
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4')
        )
        self.bucket = settings.R2_BUCKET_NAME

    def upload_file_object(self, file_obj, destination_path: str, content_type: str = 'audio/wav'):
        self.s3.upload_fileobj(
            file_obj,
            self.bucket,
            destination_path,
            ExtraArgs={"ContentType": content_type}
        )
        return destination_path
        
    def download_file(self, object_name: str, file_path: str):
        self.s3.download_file(self.bucket, object_name, file_path)

    def generate_signed_url(self, object_name: str, expiration=3600):
        # Generate a temporary AWS Signature v4 URL that bypasses the Cloudflare privacy lock
        url = self.s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': object_name},
            ExpiresIn=expiration
        )
        return url

    def delete_file(self, object_name: str):
        try:
            self.s3.delete_object(Bucket=self.bucket, Key=object_name)
        except Exception as e:
            print(f"Failed to delete {object_name} from R2: {e}")

storage_service = StorageService()
