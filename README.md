# DevOps Intern Take-Home Assessment

This repository contains a fully implemented web application that will be used for the DevOps assessment.

The application is intentionally provided as an application-level implementation. Your responsibility is to prepare, configure, containerize, deploy, and automate the application according to the assessment requirements.

You are **not expected to develop new application features or modify the application's business logic**.

---

## 1. Application Overview

The application is a simple document and item management system consisting of:

- A React + TypeScript frontend
- A FastAPI backend
- A PostgreSQL database
- S3-compatible object storage for uploaded files

The application allows users to:

- View application health
- Create, view, update, and delete items
- Upload files
- View uploaded files
- Download/open uploaded files
- Delete uploaded files

The application is intended to provide enough functionality to verify:

- Frontend deployment
- Backend deployment
- Database connectivity
- Object-storage connectivity
- Inter-service communication
- HTTP routing
- Environment configuration
- CI/CD
- Deployment and rollback

---

# 2. Repository Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── item.py
│   │   │   └── file.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── item.py
│   │   │   ├── file.py
│   │   │   └── health.py
│   │   │
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── items.py
│   │   │   └── files.py
│   │   │
│   │   └── services/
│   │       └── storage.py
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── ...
│   │
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md