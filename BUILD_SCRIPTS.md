# Build Scripts Usage Guide

## Overview
This project provides build automation scripts for both Unix/Linux/macOS (Makefile) and Windows (PowerShell).

## Windows Users (PowerShell)

Use the PowerShell script for all development tasks:

```powershell
# Show help
.\make_simple.ps1 help

# Setup development environment
.\make_simple.ps1 setup

# Install dependencies
.\make_simple.ps1 install-dev

# Run backend server
.\make_simple.ps1 dev-backend

# Run tests
.\make_simple.ps1 test

# Format code
.\make_simple.ps1 format

# Clean up files
.\make_simple.ps1 clean
```

## Unix/Linux/macOS Users (Make)

Use the traditional Makefile:

```bash
# Show help
make help

# Setup development environment  
make setup

# Install dependencies
make install-dev

# Run backend server
make dev-backend

# Run tests
make test

# Format code
make format

# Clean up files
make clean
```

## Common Commands

### Environment Setup
1. `setup` - Complete environment setup (creates .env, installs deps)
2. `install-dev` - Install development dependencies only
3. `install-frontend` - Install frontend dependencies only

### Development
1. `dev-backend` - Start FastAPI backend server (http://localhost:8000)
2. `dev-frontend` - Start Next.js frontend server (http://localhost:3000)

### Database
1. `migrate` - Run database migrations
2. `migrate-create` - Create new migration (will prompt for message)
3. `seed` - Seed database with sample data

### Testing
1. `test` - Run all tests
2. `test-unit` - Run unit tests only
3. `test-integration` - Run integration tests only
4. `test-coverage` - Run tests with coverage report

### Code Quality
1. `lint` - Run linting tools (flake8, mypy)
2. `format` - Format code (black, isort)
3. `clean` - Clean up generated files

### Utilities
1. `health-check` - Check if servers are running
2. `help` - Show available commands

## First Time Setup

1. **Clone the repository**
2. **Run setup command:**
   - Windows: `.\make_simple.ps1 setup`
   - Unix/Linux/macOS: `make setup`
3. **Edit .env file** with your database and AI configurations
4. **Run migrations:** 
   - Windows: `.\make_simple.ps1 migrate`
   - Unix/Linux/macOS: `make migrate`
5. **Start development:**
   - Windows: `.\make_simple.ps1 dev-backend`
   - Unix/Linux/macOS: `make dev-backend`

## Troubleshooting

### Windows PowerShell Execution Policy
If you get execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Python Environment
Make sure you're in the correct Python virtual environment:
```bash
# Activate virtual environment
source venv/bin/activate  # Unix/Linux/macOS
# or
venv\Scripts\activate     # Windows
```

### Node.js Dependencies
If frontend commands fail, ensure Node.js and npm are installed:
```bash
node --version
npm --version
```

## Environment Variables

Key environment variables to configure in `.env`:

```env
# Database
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/tcc_log

# AI Configuration  
OPENAI_API_KEY=your-openai-key
LM_STUDIO_BASE_URL=http://localhost:1234/v1

# Security
SECRET_KEY=your-secret-key
```

## Development Workflow

1. **Start with setup:** `setup`
2. **Create feature branch:** `git checkout -b feature/new-feature`
3. **Make changes**
4. **Format code:** `format`
5. **Run tests:** `test`
6. **Commit changes**
7. **Create pull request**

## Support

For issues with build scripts:
1. Check this README
2. Run `help` command to see available options
3. Check project documentation in `/docs`
4. Create GitHub issue if problem persists
