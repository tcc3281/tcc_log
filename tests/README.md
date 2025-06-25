# Tests Directory

Organized test files for the TCC Log project.

## Structure

### `/ai/` - AI Related Tests
- `test_agent*.py` - LangChain agent tests
- `test_sql*.py` - SQL tool tests
- `test_table*.py` - Table formatting tests

### `/debug/` - Debug Scripts
- `debug_agent*.py` - Agent debugging scripts

### `/integration/` - Integration Tests
- `test_api*.py` - API integration tests
- `test_db_connection.py` - Database connection tests
- Other integration tests

### `/` - Unit Tests
- `test_endpoints.py` - FastAPI endpoint tests
- `debug_api.py` - API debugging

## Running Tests

```bash
# Run all tests
python -m pytest tests/

# Run specific test category
python -m pytest tests/ai/
python -m pytest tests/integration/

# Run specific test file
python -m pytest tests/ai/test_agent.py
```

## Debug Scripts

Debug scripts can be run directly:
```bash
python tests/debug/debug_agent_error.py
```
