# =============================================================================
# TCC LOG - AI-POWERED LEARNING JOURNAL
# Makefile for Development and Deployment Tasks
# =============================================================================

# ===== VARIABLES =====
PYTHON := python
PIP := pip
DOCKER := docker
DOCKER_COMPOSE := docker-compose
PROJECT_NAME := tcc_log
BACKEND_DIR := .
FRONTEND_DIR := frontend

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
MAGENTA := \033[0;35m
CYAN := \033[0;36m
NC := \033[0m # No Color

.PHONY: help install install-dev setup clean test lint format docker-build docker-up docker-down migrate seed docs

# ===== HELP =====
help: ## Show this help message
	@echo "$(CYAN)TCC Log - AI-Powered Learning Journal$(NC)"
	@echo "$(YELLOW)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# ===== INSTALLATION =====
install: ## Install production dependencies
	@echo "$(BLUE)Installing production dependencies...$(NC)"
	$(PIP) install -r requirements.txt

install-dev: ## Install development dependencies
	@echo "$(BLUE)Installing development dependencies...$(NC)"
	$(PYTHON) scripts/install_dev_deps.py

install-dev-manual: ## Install development dependencies manually
	@echo "$(BLUE)Installing development dependencies manually...$(NC)"
	$(PIP) install -r requirements-dev.txt

install-frontend: ## Install frontend dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd $(FRONTEND_DIR) && npm install

# ===== SETUP =====
setup: ## Set up the development environment
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from template...$(NC)"; \
		cp env.example .env; \
		echo "$(RED)Please edit .env with your configurations$(NC)"; \
	fi
	@if [ ! -f $(FRONTEND_DIR)/.env.local ]; then \
		echo "$(YELLOW)Creating frontend .env.local file...$(NC)"; \
		cp $(FRONTEND_DIR)/.env.local.example $(FRONTEND_DIR)/.env.local 2>/dev/null || true; \
	fi
	$(MAKE) install-dev
	$(MAKE) install-frontend
	@echo "$(GREEN)Development environment setup complete!$(NC)"

# ===== DATABASE =====
migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	alembic upgrade head

migrate-create: ## Create new migration
	@echo "$(BLUE)Creating new migration...$(NC)"
	@read -p "Migration message: " msg; \
	alembic revision --autogenerate -m "$$msg"

migrate-downgrade: ## Downgrade database by one revision
	@echo "$(YELLOW)Downgrading database...$(NC)"
	alembic downgrade -1

seed: ## Seed database with sample data
	@echo "$(BLUE)Seeding database with sample data...$(NC)"
	$(PYTHON) -m app.seed_data

# ===== DEVELOPMENT =====
dev: ## Start development servers
	@echo "$(BLUE)Starting development servers...$(NC)"
	$(MAKE) dev-backend & $(MAKE) dev-frontend

dev-backend: ## Start backend development server
	@echo "$(BLUE)Starting backend development server...$(NC)"
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start frontend development server
	@echo "$(BLUE)Starting frontend development server...$(NC)"
	cd $(FRONTEND_DIR) && npm run dev

# ===== TESTING =====
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	pytest tests/ -v

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	pytest tests/unit/ -v

test-integration: ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(NC)"
	pytest tests/integration/ -v

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	pytest tests/ --cov=app --cov-report=html --cov-report=term

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	ptw tests/ -- -v

# ===== CODE QUALITY =====
lint: ## Run linting tools
	@echo "$(BLUE)Running linting tools...$(NC)"
	flake8 app/ tests/
	mypy app/
	bandit -r app/

format: ## Format code with black and isort
	@echo "$(BLUE)Formatting code...$(NC)"
	black app/ tests/
	isort app/ tests/

format-check: ## Check if code is properly formatted
	@echo "$(BLUE)Checking code formatting...$(NC)"
	black --check app/ tests/
	isort --check-only app/ tests/

security-scan: ## Run security scans
	@echo "$(BLUE)Running security scans...$(NC)"
	safety check
	bandit -r app/

# ===== DOCKER =====
docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	$(DOCKER_COMPOSE) build

docker-up: ## Start Docker containers
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	$(DOCKER_COMPOSE) up -d

docker-down: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	$(DOCKER_COMPOSE) down

docker-logs: ## Show Docker logs
	@echo "$(BLUE)Showing Docker logs...$(NC)"
	$(DOCKER_COMPOSE) logs -f

docker-clean: ## Clean up Docker resources
	@echo "$(BLUE)Cleaning up Docker resources...$(NC)"
	$(DOCKER) system prune -f
	$(DOCKER) volume prune -f

# ===== DOCUMENTATION =====
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	sphinx-build -b html docs/ docs/_build/html

docs-serve: ## Serve documentation locally
	@echo "$(BLUE)Serving documentation...$(NC)"
	cd docs/_build/html && python -m http.server 8080

# ===== DATABASE UTILITIES =====
db-shell: ## Connect to database shell
	@echo "$(BLUE)Connecting to database shell...$(NC)"
	@if [ -f .env ]; then \
		. .env; \
		psql $$DATABASE_URL; \
	else \
		echo "$(RED)No .env file found$(NC)"; \
	fi

db-backup: ## Backup database
	@echo "$(BLUE)Backing up database...$(NC)"
	@if [ -f .env ]; then \
		. .env; \
		pg_dump $$DATABASE_URL > backup_$$(date +%Y%m%d_%H%M%S).sql; \
		echo "$(GREEN)Database backed up successfully$(NC)"; \
	else \
		echo "$(RED)No .env file found$(NC)"; \
	fi

db-restore: ## Restore database from backup
	@echo "$(BLUE)Restoring database...$(NC)"
	@read -p "Backup file path: " backup_file; \
	if [ -f .env ]; then \
		. .env; \
		psql $$DATABASE_URL < $$backup_file; \
		echo "$(GREEN)Database restored successfully$(NC)"; \
	else \
		echo "$(RED)No .env file found$(NC)"; \
	fi

# ===== DEPLOYMENT =====
deploy-staging: ## Deploy to staging environment
	@echo "$(BLUE)Deploying to staging...$(NC)"
	# Add staging deployment commands here

deploy-production: ## Deploy to production environment
	@echo "$(BLUE)Deploying to production...$(NC)"
	# Add production deployment commands here

# ===== UTILITIES =====
clean: ## Clean up generated files
	@echo "$(BLUE)Cleaning up generated files...$(NC)"
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name ".pytest_cache" -delete
	find . -type f -name ".coverage" -delete
	rm -rf htmlcov/
	rm -rf .mypy_cache/
	rm -rf dist/
	rm -rf build/
	rm -rf *.egg-info/

logs: ## Show application logs
	@echo "$(BLUE)Showing application logs...$(NC)"
	tail -f app.log 2>/dev/null || echo "No log file found"

requirements-update: ## Update requirements files
	@echo "$(BLUE)Updating requirements files...$(NC)"
	pip-compile requirements.in
	pip-compile requirements-dev.in

check-deps: ## Check for outdated dependencies
	@echo "$(BLUE)Checking for outdated dependencies...$(NC)"
	pip list --outdated

# ===== AI MODEL MANAGEMENT =====
ai-models: ## List available AI models
	@echo "$(BLUE)Available AI models:$(NC)"
	@echo "  - OpenAI: gpt-3.5-turbo, gpt-4"
	@echo "  - LM Studio: (check your local models)"

ai-test: ## Test AI connectivity
	@echo "$(BLUE)Testing AI connectivity...$(NC)"
	$(PYTHON) -c "from app.ai.lm_studio import test_connection; test_connection()"

# ===== MONITORING =====
monitor: ## Start monitoring dashboard
	@echo "$(BLUE)Starting monitoring dashboard...$(NC)"
	$(DOCKER_COMPOSE) up -d prometheus grafana

health-check: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	curl -f http://localhost:8000/health || echo "$(RED)Backend not responding$(NC)"
	curl -f http://localhost:3000 || echo "$(RED)Frontend not responding$(NC)"

# ===== PRE-COMMIT =====
pre-commit-install: ## Install pre-commit hooks
	@echo "$(BLUE)Installing pre-commit hooks...$(NC)"
	pre-commit install

pre-commit-run: ## Run pre-commit hooks on all files
	@echo "$(BLUE)Running pre-commit hooks...$(NC)"
	pre-commit run --all-files

# ===== DEFAULT TARGET =====
.DEFAULT_GOAL := help
