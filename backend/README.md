# Backend - DevOps Assessment Dashboard

FastAPI service exposing Health, Items, and Files APIs, backed by
PostgreSQL (via Alchemical/SQLAlchemy) and S3-compatible object storage
(via boto3).

## Structure

```text
app/
├── main.py         FastAPI app, startup (schema + seed data + bucket setup), CORS, routing
├── config.py        Environment-driven settings (pydantic-settings)
├── database.py       Alchemical instance, session dependency, init_db()
├── models/           SQLAlchemy models: Item, File
├── schemas/          Pydantic request/response schemas
├── routes/           health.py, items.py, files.py
└── services/
    └── storage.py    All boto3/S3 logic lives here
```

## Configuration

Include the appropriate environment variables.

## Running

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On startup the app:

1. Creates database tables if they don't exist (no migration framework needed for this assessment app)
2. Seeds three sample `Item` rows if the table is empty
3. Ensures the configured S3 bucket exists (creates it if not - handy for LocalStack, which starts empty)

## API surface

All endpoints are documented interactively at `/docs` (Swagger UI).

| Method | Path               | Description                           |
| ------ | ------------------ | ------------------------------------- |
| GET    | `/api/health`      | Backend liveness                      |
| GET    | `/api/health/db`   | Runs `SELECT 1` against PostgreSQL    |
| GET    | `/api/health/s3`   | Checks the configured S3 bucket       |
| GET    | `/api/health/full` | Combined backend/db/storage check     |
| GET    | `/api/items`       | List items                            |
| GET    | `/api/items/{id}`  | Get one item (404 if missing)         |
| POST   | `/api/items`       | Create an item                        |
| PUT    | `/api/items/{id}`  | Update an item                        |
| DELETE | `/api/items/{id}`  | Delete an item                        |
| GET    | `/api/files`       | List file metadata                    |
| POST   | `/api/files`       | Upload a file (multipart/form-data)   |
| GET    | `/api/files/{id}`  | Get a presigned download URL          |
| DELETE | `/api/files/{id}`  | Delete a file (S3 object + DB record) |
