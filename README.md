# Greater Amman Municipality - Building Permits Portal

A bilingual (Arabic/English) web application for processing building permit applications with AI-powered document verification.

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + next-intl
- **Backend**: Python FastAPI + SQLAlchemy + PostgreSQL
- **Document Processing**: OCR (Tesseract) + AI Extraction (Claude API)
- **Background Tasks**: Celery + Redis
- **Infrastructure**: Docker Compose

## Quick Start

```bash
# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Seed initial data (permit types and checklists)
docker-compose exec backend python -m app.seed
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Features

- **Bilingual Support**: Full Arabic (RTL) and English interface
- **Building Permit Types**: Construction, Renovation, Demolition
- **Document Upload**: PDF and DWF file support
- **AI Document Processing**: OCR + Claude API for intelligent data extraction
- **Checklist Validation**: Automated document verification against permit requirements
- **Admin Dashboard**: Review, approve, and reject applications

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@localhost:5432/gam_permits` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT signing key | `dev-secret-key` |
| `ANTHROPIC_API_KEY` | Claude API key for document extraction | - |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | `http://localhost:8000/api/v1` |
