# DevOps Intern Take-Home Assessment

This repository contains the complete infrastructure, containerization, reverse proxy routing, CI/CD pipeline, and deployment automation for the DevOps Assessment.

---

## 1. Architecture Overview

The system is a containerized multi-tier web application running across isolated Docker networks, reverse-proxied through Traefik:

- **Reverse Proxy**: Traefik v3 routing traffic via HTTP Host headers on port 80.
- **Frontend**: React + TypeScript built via multi-stage Docker build and served by Nginx Alpine. Routed at `http://app.debyez.localhost`.
- **Backend**: FastAPI running on Python 3.12-slim via Uvicorn under an unprivileged user (`appuser`). Routed at `http://api.debyez.localhost`.
- **Database**: PostgreSQL 16 Alpine with persistent volume storage (`postgres_data`).
- **Object Storage**: S3-compatible storage using MiniStack (`ministackorg/ministack`) on port 4566 with persistent data and state volumes.

---

## 2. Prerequisites

Ensure the following tools are installed on your host machine:

- **Docker Engine** (20.10+) & **Docker Compose V2** (`docker compose`)
- **curl**: For health checks and API verification
- **Modern Web Browser**: Chrome, Firefox, or Edge

---

## 3. Repository Structure

```text
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions CI/CD pipeline
├── backend/
│   ├── app/                      # FastAPI application code
│   ├── Dockerfile                # Python 3.12-slim non-root image
│   ├── .dockerignore             # Excludes cache, venv, and local configs
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/                      # React TypeScript source
│   ├── Dockerfile                # Multi-stage build (Node 20 builder -> Nginx runtime)
│   ├── nginx.conf                # Minimal routing configuration
│   ├── .dockerignore             # Excludes node_modules and build artifacts
│   └── package.json
├── scripts/
│   ├── deploy.sh                 # Production deployment script with health check & auto-rollback
│   └── rollback.sh               # Instant rollback to previous working version
├── .env.example                  # Environment template for local development
├── .env.prod.example             # Environment template for production simulation
├── docker-compose.yml            # Local development Compose configuration (builds from source)
├── docker-compose.prod.yml       # Production Compose configuration (pulls prebuilt images by SHA)
├── .gitignore
└── README.md
```

---

## 4. Environment Configuration

The application is configured through environment variables.

### Local Development Setup

Create your local `.env` file from the provided template:

```bash
cp .env.example .env
```

### Configuration Variables Reference

| Variable | Description | Default / Value |
| :--- | :--- | :--- |
| `APP_NAME` | Application display name | `DevOps Assessment Dashboard` |
| `ENVIRONMENT` | Runtime environment mode | `development` (`production` in prod) |
| `DB_HOST` / `DB_PORT` | Database host and internal port | `db` / `5432` |
| `DB_USER` / `DB_PASSWORD` | PostgreSQL credentials | `postgres` / `postgres` |
| `DB_NAME` | PostgreSQL database name | `devops_assessment` |
| `AWS_ACCESS_KEY_ID` / `_SECRET` | S3 API credentials | `test` / `test` |
| `AWS_REGION` | AWS region name | `us-east-1` |
| `S3_ENDPOINT_URL` | Docker internal S3 endpoint | `http://ministack:4566` |
| `S3_PUBLIC_ENDPOINT_URL` | Host-accessible S3 endpoint (presigned URLs) | `http://localhost:4566` |
| `S3_BUCKET_NAME` | S3 bucket name | `devops-assessment-files` |
| `PRESIGNED_URL_EXPIRATION_SECONDS` | Lifetime of presigned URLs (seconds) | `300` |
| `CORS_ORIGINS` | Allowed browser origins | `http://app.debyez.localhost,http://api.debyez.localhost` |
| `VITE_API_BASE_URL` | Base API URL baked into frontend build | `http://api.debyez.localhost/api` |
| `DOCKERHUB_USERNAME` | Docker Hub registry username (prod) | `armdebug` |
| `IMAGE_TAG` | Target image tag (prod) | Commit SHA or `latest` |

---

## 5. Local Development Workflow

In local development, images are built directly from source files using `docker-compose.yml`.

### Starting the Stack

```bash
docker compose up -d --build
```

### Stopping the Stack

To stop containers while keeping database and object storage data:
```bash
docker compose down
```

To stop containers and completely wipe volumes (clean start):
```bash
docker compose down -v
```

### Checking Container Status

```bash
docker compose ps
```

---

## 6. Reverse Proxy & Hostname Routing (Traefik)

Traefik v3 acts as the single edge gateway for all HTTP traffic on port 80.

### Routing Rules

- **Frontend**: `http://app.debyez.localhost` $\rightarrow$ routes to `frontend:80`
- **Backend API**: `http://api.debyez.localhost` $\rightarrow$ routes to `backend:8000`

### Service Isolation

For security and internal network isolation:
- Direct host port mappings are **removed** for PostgreSQL (`db:5432`) and FastAPI (`backend:8000`).
- Only **Traefik (port 80)** and **MiniStack (port 4566)** expose ports to the host.
- Browser presigned URLs interact directly with MiniStack at `http://localhost:4566`, while backend-to-storage operations happen internally at `http://ministack:4566`.

### Health Check Endpoints

All health checks can be queried through Traefik (*Base URL: `http://api.debyez.localhost`*):

| Endpoint | Target Component | Expected Status / Response |
| :--- | :--- | :--- |
| `GET /api/health` | Backend process liveness | `{"status":"ok","service":"backend"}` |
| `GET /api/health/db` | Database connection | `{"status":"ok","database":"connected","detail":null}` |
| `GET /api/health/s3` | Object storage connection | `{"status":"ok","storage":"connected","bucket":"devops-assessment-files","detail":null}` |
| `GET /api/health/full` | Aggregated system health | `{"status":"ok","backend":"ok","database":"connected","storage":"connected"}` |

---

## 7. Object Storage Architecture (MiniStack Decision)

The initial assessment brief suggested LocalStack for S3 simulation. During implementation, **MiniStack** (`ministackorg/ministack:latest`) was selected as a drop-in replacement:

- **MiniStack over LocalStack**: Modern LocalStack releases mandate an external API authentication key (`LOCALSTACK_AUTH_TOKEN`, failing with exit code 55 if omitted). MiniStack serves as a drop-in S3 replacement on the same port (`4566`) with persistent volume support and zero authentication requirements.

---

## 8. CI/CD Pipeline (GitHub Actions)

The workflow is defined in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml).

### Pipeline Triggers

- **Pull Requests to `main`**: Runs application validation without publishing images.
- **Push / Merges to `main`**: Runs validation, builds Docker images tagged with the commit SHA and `latest`, and pushes them to Docker Hub.

### Jobs Breakdown

1. **`validate-backend`**:
   - Sets up Python 3.12 with pip cache.
   - Installs dependencies from `backend/requirements.txt`.
   - Validates Python syntax and bytecode compilation across the codebase via `python -m compileall backend/app`.
2. **`validate-frontend`**:
   - Sets up Node.js 20 with npm cache.
   - Runs `npm ci` followed by `npm run lint`
   - Verifies the production build with `npm run build`.
3. **`build-and-publish`** (Push to `main` only):
   - Authenticates to Docker Hub using GitHub repository secrets.
   - Builds and publishes Backend image:
     - `${DOCKERHUB_USERNAME}/devops-assessment-backend:<COMMIT_SHA>`
     - `${DOCKERHUB_USERNAME}/devops-assessment-backend:latest`
   - Builds and publishes Frontend image:
     - `${DOCKERHUB_USERNAME}/devops-assessment-frontend:<COMMIT_SHA>`
     - `${DOCKERHUB_USERNAME}/devops-assessment-frontend:latest`
     - Build argument: `VITE_API_BASE_URL=http://api.debyez.localhost/api`

### Required GitHub Secrets

Configure these under your repository **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**:

- `DOCKERHUB_USERNAME`: Your Docker Hub account username
- `DOCKERHUB_TOKEN`: A Docker Hub Personal Access Token with Read & Write permissions.

---

## 9. Production Deployment & Rollback

Production deployment uses `docker-compose.prod.yml`. Unlike development, **production does not build images locally**; it strictly pulls prebuilt, versioned images from Docker Hub.

### Production Environment Setup

```bash
cp .env.prod.example .env.prod
```

Ensure `DOCKERHUB_USERNAME` in `.env.prod` matches your Docker Hub repository.

### Automated Deployment (`scripts/deploy.sh`)

Deploy a target commit-SHA version:

```bash
./scripts/deploy.sh <COMMIT_SHA>
```

**How the deployment script works:**
1. Pulls target images (`backend` and `frontend`) from Docker Hub.
2. Starts the production stack using `docker compose -f docker-compose.prod.yml`.
3. Polls `http://api.debyez.localhost/api/health/full` for up to 30 seconds (15 attempts at 2s intervals).
4. **On success**:
   - Saves previous working tag to `.deploy_state/previous_version`.
   - Saves new tag into `.deploy_state/current_version`.
   - Reports `Deployment successful: <COMMIT_SHA>`.
5. **On failure**:
   - Automatically invokes `scripts/rollback.sh` to restore the last known working version.

### Automated Rollback (`scripts/rollback.sh`)

To manually restore the previous known working version without rebuilding:

```bash
./scripts/rollback.sh
```

**How rollback works:**
1. Reads previous working tag from `.deploy_state/previous_version`.
2. Redeploys that prebuilt image immediately via `docker-compose.prod.yml`.
3. Verifies application health at `http://api.debyez.localhost/api/health/full`.
4. Updates `.deploy_state/current_version` back to the restored version.

### Identifying Deployed Versions

```bash
# Currently running version
cat .deploy_state/current_version

# Last known working version
cat .deploy_state/previous_version
```

*(Manual Compose alternative: `IMAGE_TAG=<COMMIT_SHA> docker compose --env-file .env.prod -f docker-compose.prod.yml up -d`)*

---

## 10. End-to-End Verification Guide

Once the stack is running, execute the following commands to verify all services:

### 1. Verify Application Health

```bash
# Aggregated system health
curl -s http://api.debyez.localhost/api/health/full
# Expected: {"status":"ok","backend":"ok","database":"connected","storage":"connected"}
```

*(Individual component endpoints `/api/health`, `/api/health/db`, and `/api/health/s3` are detailed in Section 6).*

### 2. Verify Frontend Delivery

```bash
curl -sI http://app.debyez.localhost/
# Expected: HTTP/1.1 200 OK
```

### 3. Verify Database CRUD Operations

```bash
# 1. List existing items (seed data)
curl -s http://api.debyez.localhost/api/items

# 2. Create a new item
curl -s -X POST http://api.debyez.localhost/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Verification Item", "description": "Testing end-to-end CRUD", "status": "active"}'

# 3. Delete an item (replace <ID> with item id)
curl -s -X DELETE http://api.debyez.localhost/api/items/<ID>
```

### 4. Verify Object Storage File Flow

```bash
# 1. Create a temporary file and upload it
echo "DevOps Verification File Content" > /tmp/test_file.txt
curl -s -X POST http://api.debyez.localhost/api/files \
  -F "file=@/tmp/test_file.txt"
# Returns JSON with file ID, e.g. {"id": 1, "filename": "test_file.txt", ...}

# 2. List uploaded files
curl -s http://api.debyez.localhost/api/files

# 3. Get presigned download URL (replace 1 with file id)
curl -s http://api.debyez.localhost/api/files/1

# 4. Download file content using the generated presigned URL
DOWNLOAD_URL=$(curl -s http://api.debyez.localhost/api/files/1 | python3 -c "import sys, json; print(json.load(sys.stdin)['url'])")
curl -s "$DOWNLOAD_URL"
# Output: DevOps Verification File Content

# 5. Delete file
curl -s -X DELETE http://api.debyez.localhost/api/files/1
```

---

## 11. Troubleshooting

### 1. `*.localhost` Domain Does Not Resolve

On most modern Linux systems, `systemd-resolved` automatically resolves any `*.localhost` domain to `127.0.0.1`. If your DNS resolver does not support wildcard `.localhost`, add the domains to `/etc/hosts`:

```text
127.0.0.1 app.debyez.localhost api.debyez.localhost
```

### 2. Port Conflicts (Port 80 or 4566 in use)

If another web server or local service is running on port 80 or 4566:

```bash
sudo lsof -i :80
sudo lsof -i :4566
```
Stop the conflicting service before starting the stack.

### 3. Permission Denied on Docker Socket

Traefik requires read-only access to `/var/run/docker.sock` to detect container routing labels. If Traefik logs show permission denied errors, ensure your user belongs to the `docker` group:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 4. Starting with Clean Volumes

If database schemas or MiniStack storage need to be reset from scratch:

```bash
docker compose down -v
docker compose up -d --build
```

---

## 12. Screen Recording

Demonstration of the working solution, CI/CD, and automated rollback:
- [Watch Screen Recording](https://www.loom.com/share/308e0b96385d4b4d8afde47260efb49d)


