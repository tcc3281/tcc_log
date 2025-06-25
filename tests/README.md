# Tests Directory

Organized test files for the TCC Log project.

## Structure

### `/ai/` - AI Related Tests
- `test_agent*.py` - LangChain agent tests
- `test_sql*.py` - SQL tool tests
- `test_table*.py` - Table formatting tests

### `/integration/` - Integration Tests
- `test_api*.py` - API integration tests
- `test_db_connection.py` - Database connection tests
- Other integration tests

### `/` - Unit Tests
- `test_endpoints.py` - FastAPI endpoint tests
- `debug_api.py` - API debugging

**Note**: Debug scripts have been moved to `/dev-tools/` directory for better organization.

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

Debug scripts are now located in `/dev-tools/` directory:
```bash
python dev-tools/debug_agent_error.py
python dev-tools/debug_agent_streaming.py
python dev-tools/debug_agent_tools.py
```

See `/dev-tools/README.md` for detailed usage instructions.
