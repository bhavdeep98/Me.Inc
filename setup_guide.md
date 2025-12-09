# Setup Guide

## Prerequisites
- Python 3.10+
- PostgreSQL 14+

## Database Setup
The application requires a running PostgreSQL database.
1. Install PostgreSQL (e.g., `brew install postgresql@14`)
2. Start the service: `brew services start postgresql@14`
3. Create the database: `createdb job_agent`

## Application Setup
1. **Activate Virtual Environment**:
   ```bash
   source venv/bin/activate
   ```

2. **Environment Variables**:
   Create a `.env` file in `backend/` if you need to customize the DB URL:
   ```bash
   DATABASE_URL=postgresql://user:password@localhost/job_agent
   ```

3. **Run the Backend**:
   ```bash
   cd backend
   ../venv/bin/uvicorn app.main:app --reload
   ```

4. **Verify**:
   Visit `http://localhost:8000/health`
