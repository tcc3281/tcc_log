# Journal App

Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL
Frontend: Next.js + TailwindCSS

## Setup with Docker (Recommended)

### On Windows (PowerShell)
```powershell
# Navigate to the project directory
cd d:\chientuhocai\tcc_log

# Run the setup script
.\run_docker.ps1
```

This will:
1. Build the Docker images
2. Start the containers (PostgreSQL, Backend, Frontend)
3. Run migrations
4. Make the application available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Manual Docker Setup
```bash
# Stop any running containers
docker-compose down

# Build the images
docker-compose build

# Start the containers
docker-compose up -d

# Run migrations (if needed)
docker-compose exec backend python -m alembic upgrade head
```

## Setup Without Docker (Development)

1. Create and activate a Conda environment named `tcc_log`:

    ```bash
    conda create -n tcc_log python=3.10 -y
    conda activate tcc_log
    ```

2. Install backend dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3. Create a `.env` file in the project root with:

    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/journal_db
    SECRET_KEY=your-secret-key
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

4. Initialize migrations (if needed):

    ```bash
    alembic init alembic
    ```

5. Configure `alembic.ini` to use the `DATABASE_URL` and update `alembic/env.py`.

6. Create and run migrations:

    ```bash
    alembic revision --autogenerate -m "Initial migration"
    alembic upgrade head
    ```

7. Run the backend server:

    ```bash
    uvicorn app.main:app --reload
    ```

8. Install and run the frontend:

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Features
- User authentication and profile management
- Upload and manage profile images
- Create and manage journal entries
- Topic organization
- Markdown editor for rich journal content
- File attachments

## Project Structure

- app/ - Backend FastAPI application
- frontend/ - Next.js frontend application
- alembic/ - Database migrations
- uploads/ - Uploaded files (profile images, attachments)

## Profile Images Configuration
Profile images are stored in the `uploads/profiles` directory and will be served directly from the backend API. When running in Docker, profile images are shared between the backend and frontend containers using a shared volume.
  - database.py
  - models.py
  - main.py
  - schemas.py
  - crud.py
  - api/
    - dependencies.py
    - users.py
    - topics.py
    - entries.py
    - files.py
    - links.py
    - tags.py
- alembic/
- requirements.txt
- README.md 