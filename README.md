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
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your own values (database credentials, secret key, etc.)

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

Copy `.env.example` to `.env` and fill in your values. See `.env.example` for all required variables.

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_USER` | PostgreSQL username | Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password | Yes |
| `POSTGRES_DB` | PostgreSQL database name | Yes |
| `DATABASE_URL` | Full PostgreSQL connection string | Yes |
| `SECRET_KEY` | JWT signing key (use a long random string) | Yes |
| `REDIS_URL` | Redis connection string | No (defaults to localhost) |
| `ANTHROPIC_API_KEY` | Claude API key for document extraction | For AI features |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | No (defaults to localhost) |
