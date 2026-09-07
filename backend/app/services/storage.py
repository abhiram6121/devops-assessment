"""
S3-compatible object storage service.

All boto3 usage is encapsulated here so that routes never touch the S3 SDK
directly. The service uses two S3 clients:

1. Internal client:
   Used by the backend container for bucket/object operations.
   Its endpoint must be reachable from inside Docker when containerised

2. Public/presign client:
   Used only to generate presigned URLs returned to the browser.
   Its endpoint must be reachable by the browser

See app/config.py for environment configuration.
"""

import logging
import uuid
from typing import BinaryIO

import boto3
from botocore.client import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError

from app.config import settings

logger = logging.getLogger(__name__)


class StorageError(Exception):
    """Raised when a storage operation fails."""


class StorageService:
    def __init__(self) -> None:
        self.bucket_name = settings.S3_BUCKET_NAME

        boto_config = BotoConfig(signature_version="s3v4")

        self._client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL or None,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=boto_config,
        )

        self._presign_client = boto3.client(
            "s3",
            endpoint_url=(
                settings.S3_PUBLIC_ENDPOINT_URL or settings.S3_ENDPOINT_URL or None
            ),
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=boto_config,
        )

    # -- setup -------------------------------------------------------------

    def ensure_bucket(self) -> None:
        """Create the configured bucket if it doesn't already exist.

        Safe to call on every startup - useful for LocalStack, which starts
        out with no buckets at all.
        """
        try:
            self._client.head_bucket(Bucket=self.bucket_name)
            logger.info("S3 bucket '%s' already exists", self.bucket_name)

        except (ClientError, BotoCoreError):
            try:
                if settings.AWS_REGION == "us-east-1":
                    self._client.create_bucket(Bucket=self.bucket_name)
                else:
                    self._client.create_bucket(
                        Bucket=self.bucket_name,
                        CreateBucketConfiguration={
                            "LocationConstraint": settings.AWS_REGION
                        },
                    )

                logger.info(
                    "Created S3 bucket '%s'",
                    self.bucket_name,
                )

            except (ClientError, BotoCoreError) as exc:
                logger.error(
                    "Could not create S3 bucket '%s': %s",
                    self.bucket_name,
                    exc,
                )

    # -- health ------------------------------------------------------------

    def check_connection(self) -> None:
        """Raise StorageError if the configured bucket cannot be reached."""
        try:
            self._client.head_bucket(Bucket=self.bucket_name)

        except (ClientError, BotoCoreError) as exc:
            raise StorageError(f"Unable to reach bucket '{self.bucket_name}'") from exc

    # -- object operations -------------------------------------------------

    def build_object_key(self, filename: str) -> str:
        return f"uploads/{uuid.uuid4()}/{filename}"

    def upload_file(
        self,
        file_obj: BinaryIO,
        object_key: str,
        content_type: str,
    ) -> None:
        try:
            extra_args = {"ContentType": content_type} if content_type else None

            self._client.upload_fileobj(
                file_obj,
                self.bucket_name,
                object_key,
                ExtraArgs=extra_args,
            )

        except (ClientError, BotoCoreError) as exc:
            logger.error(
                "S3 upload failed for key '%s': %s",
                object_key,
                exc,
            )
            raise StorageError("Failed to upload file to storage") from exc

    def delete_file(self, object_key: str) -> None:
        try:
            self._client.delete_object(
                Bucket=self.bucket_name,
                Key=object_key,
            )

        except (ClientError, BotoCoreError) as exc:
            logger.error(
                "S3 delete failed for key '%s': %s",
                object_key,
                exc,
            )
            raise StorageError("Failed to delete file from storage") from exc

    def generate_download_url(
        self,
        object_key: str,
        filename: str,
    ) -> str:
        try:
            return self._presign_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": object_key,
                    "ResponseContentDisposition": (f'inline; filename="{filename}"'),
                },
                ExpiresIn=(settings.PRESIGNED_URL_EXPIRATION_SECONDS),
            )

        except (ClientError, BotoCoreError) as exc:
            logger.error(
                "Presigned URL generation failed for key '%s': %s",
                object_key,
                exc,
            )
            raise StorageError("Failed to generate download URL") from exc


storage_service = StorageService()
