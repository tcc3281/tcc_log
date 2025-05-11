# Journal App

Backend: FastAPI + SQLAlchemy + Alembic + PostgreSQL

## Setup

1. Create and activate a Conda environment named `tcc_log`:

    ```bash
    conda create -n tcc_log python=3.10 -y
    conda activate tcc_log
    ```

2. Install dependencies:

    ```bash
    pip install -r requirements.txt
    ```

3. Create a `.env` file in the project root with:

    ```env
    DATABASE_URL=postgresql://user:password@localhost:5432/journal_db
    SECRET_KEY=your-secret-key
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

4. Initialize migrations:

    ```bash
    alembic init alembic
    ```

5. Configure `alembic.ini` to use the `DATABASE_URL` and update `alembic/env.py`.

6. Create and run migrations:

    ```bash
    alembic revision --autogenerate -m "Initial migration"
    alembic upgrade head
    ```

7. Run the server:

    ```bash
    uvicorn app.main:app --reload
    ```

## Project Structure

- app/
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