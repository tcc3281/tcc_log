# Tests Organization

This directory contains all test files for the TCC Log project, organized by type and purpose.

## Directory Structure

```
tests/
├── __init__.py                     # Makes tests a Python package
├── conftest.py                     # Pytest configuration and fixtures
├── README.md                       # This file - explains test organization
├── test_endpoints.py               # Main API endpoint tests
├── config/                         # Test configuration files
│   ├── __init__.py
│   ├── test_config.py              # Configuration for tests
│   └── simple_test_config.py       # Simplified test config
├── ai/                             # AI-related tests
│   ├── test_*.py                   # Various AI feature tests
├── integration/                    # Integration tests
│   ├── test_auth_complete.py       # Complete authentication flow tests
│   ├── test_complete_flow.py       # End-to-end flow tests
│   ├── test_frontend_scenario.py   # Frontend scenario tests
│   ├── test_simple_api.py          # Simple API integration tests
│   └── test_simple_database.py     # Database integration tests
├── unit/                           # Unit tests
│   ├── test_auth.py                # Authentication unit tests
│   ├── test_models.py              # Model unit tests
│   └── test_simple_auth.py         # Simple auth unit tests
└── utility/                       # Utility scripts for testing
    ├── check_auth.py               # Check authentication setup
    ├── check_db.py                 # Check database connection
    └── create_test_user.py         # Create test users
```

## Test Categories

### Integration Tests (`integration/`)
- **test_auth_complete.py**: Tests complete authentication flow (login → token → API calls)
- **test_complete_flow.py**: Tests end-to-end user flows (login → create topic → create entry)
- **test_frontend_scenario.py**: Tests simulating frontend interactions
- **test_simple_api.py**: Basic API integration tests
- **test_simple_database.py**: Database connectivity and basic operations

### Unit Tests (`unit/`)
- **test_auth.py**: Authentication logic unit tests
- **test_models.py**: Database model unit tests
- **test_simple_auth.py**: Simplified authentication tests

### AI Tests (`ai/`)
- Various tests for AI features (agent, SQL processing, etc.)

### Utility Scripts (`utility/`)
- **check_auth.py**: Verify authentication setup
- **check_db.py**: Verify database connection and setup
- **create_test_user.py**: Create test users for testing

### `/integration/` - Integration Tests
- `test_api*.py` - API integration tests
- `test_db_connection.py` - Database connection tests
- Other integration tests

### `/` - Unit Tests
- `test_endpoints.py` - FastAPI endpoint tests
- `debug_api.py` - API debugging

**Note**: Debug scripts have been moved to `/dev-tools/` directory for better organization.

## Running Tests

### Run all tests:
```bash
pytest tests/
```

### Run specific test categories:
```bash
# Integration tests only
pytest tests/integration/

# Unit tests only
pytest tests/unit/

# Specific test file
pytest tests/integration/test_auth_complete.py
```

### Run utility scripts:
```bash
# Check database connection
python tests/utility/check_db.py

# Check authentication setup
python tests/utility/check_auth.py

# Create a test user
python tests/utility/create_test_user.py
```

## Test Data

Tests use the database configuration from `.env.test` file. Make sure this file exists and points to a test database, not your production database.

## Notes

- All test files have been cleaned up and organized from the root directory
- Duplicate and obsolete test files have been removed
- Each test category serves a specific purpose in the testing strategy
- Utility scripts are available for debugging and setup verification
