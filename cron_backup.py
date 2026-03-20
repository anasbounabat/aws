#!/usr/bin/env python3
"""
Cron de backup en Python — lance manuellement ou via crontab.
Usage : python3 cron_backup.py
Crontab (toutes les heures) : 0 * * * * python3 /chemin/cron_backup.py
"""
import json
import os
import boto3
import psycopg2
from datetime import datetime, timezone

DATABASE_URL = os.environ.get("DATABASE_URL", "postgres://anasbounabat@localhost:5432/trello")
BACKUP_BUCKET = os.environ.get("BACKUP_S3_BUCKET", "trello-backups-stg")
AWS_REGION = os.environ.get("AWS_REGION", "eu-north-1")


def parse_db_url(url):
    """Parse postgres://user:pass@host:port/db"""
    url = url.replace("postgres://", "").replace("postgresql://", "")
    user_pass, rest = url.split("@")
    user = user_pass.split(":")[0]
    password = user_pass.split(":")[1] if ":" in user_pass else ""
    host_port, db = rest.split("/")
    host = host_port.split(":")[0]
    port = int(host_port.split(":")[1]) if ":" in host_port else 5432
    return dict(host=host, port=port, user=user, password=password, dbname=db)


def run_backup():
    print(f"[{datetime.now()}] Démarrage backup...")

    # 1. Connexion DB
    conn = psycopg2.connect(**parse_db_url(DATABASE_URL))
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM users")
    users = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM teams")
    teams = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM projects")
    projects = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM tasks")
    tasks = cur.fetchone()[0]

    payload = {
        "at": datetime.now(timezone.utc).isoformat(),
        "users": users,
        "teams": teams,
        "projects": projects,
        "tasks": tasks
    }

    # 2. Upload S3
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    key = f"backups/backup-{ts}.json"

    s3 = boto3.client("s3", region_name=AWS_REGION)
    s3.put_object(
        Bucket=BACKUP_BUCKET,
        Key=key,
        Body=json.dumps(payload, indent=2),
        ContentType="application/json"
    )

    s3_url = f"s3://{BACKUP_BUCKET}/{key}"

    # 3. Enregistrer en DB
    cur.execute("INSERT INTO backups (s3_url) VALUES (%s)", (s3_url,))
    conn.commit()
    cur.close()
    conn.close()

    print(f"[OK] Backup stocké : {s3_url}")
    print(f"     Stats : {users} users, {teams} teams, {projects} projects, {tasks} tasks")


if __name__ == "__main__":
    run_backup()
