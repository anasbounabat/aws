#!/usr/bin/env python3
"""
Upload a local folder to S3 (sync-style), with optional deletion.

Example:
  python infrastructure/scripts/upload_s3.py \
    --source code/www-user/.output/public \
    --bucket nuxt-support-assets-001 \
    --region eu-north-1 \
    --delete
"""

from __future__ import annotations

import argparse
import hashlib
import mimetypes
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError


def md5_hex(path: Path) -> str:
    h = hashlib.md5()  # nosec B324 - used only for S3 ETag compare
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def list_local_files(source: Path) -> dict[str, Path]:
    out: dict[str, Path] = {}
    for p in source.rglob("*"):
        if p.is_file():
            out[str(p.relative_to(source)).replace("\\", "/")] = p
    return out


def list_s3_keys(s3_client, bucket: str, prefix: str) -> set[str]:
    keys: set[str] = set()
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            k = obj["Key"]
            if prefix and k.startswith(prefix):
                k = k[len(prefix) :]
            keys.add(k)
    return keys


def main() -> int:
    parser = argparse.ArgumentParser(description="Upload local folder to S3")
    parser.add_argument("--source", required=True, help="Local source directory")
    parser.add_argument("--bucket", required=True, help="S3 bucket name")
    parser.add_argument("--region", required=True, help="AWS region")
    parser.add_argument("--prefix", default="", help="Optional S3 key prefix")
    parser.add_argument("--delete", action="store_true", help="Delete remote files not present locally")
    args = parser.parse_args()

    source = Path(args.source).resolve()
    if not source.exists() or not source.is_dir():
        raise SystemExit(f"Invalid source directory: {source}")

    prefix = args.prefix.strip("/")
    if prefix:
        prefix = prefix + "/"

    s3 = boto3.client("s3", region_name=args.region)
    local_files = list_local_files(source)
    remote_keys = list_s3_keys(s3, args.bucket, prefix)

    uploaded = 0
    skipped = 0

    for rel_key, file_path in local_files.items():
        s3_key = f"{prefix}{rel_key}"
        local_md5 = md5_hex(file_path)

        should_upload = True
        try:
            head = s3.head_object(Bucket=args.bucket, Key=s3_key)
            etag = str(head.get("ETag", "")).strip('"')
            # ETag matches md5 for non-multipart uploads.
            if etag == local_md5:
                should_upload = False
        except ClientError as e:
            status = e.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
            if status not in (403, 404):
                raise

        if not should_upload:
            skipped += 1
            continue

        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        s3.upload_file(
            str(file_path),
            args.bucket,
            s3_key,
            ExtraArgs={"ContentType": content_type},
        )
        uploaded += 1
        print(f"Uploaded: s3://{args.bucket}/{s3_key}")

    deleted = 0
    if args.delete:
        local_keys = set(local_files.keys())
        to_delete = sorted(remote_keys - local_keys)
        for rel_key in to_delete:
            s3.delete_object(Bucket=args.bucket, Key=f"{prefix}{rel_key}")
            deleted += 1
            print(f"Deleted: s3://{args.bucket}/{prefix}{rel_key}")

    print(f"Done. uploaded={uploaded}, skipped={skipped}, deleted={deleted}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (BotoCoreError, ClientError) as e:
        print(f"AWS error: {e}")
        raise SystemExit(1)
