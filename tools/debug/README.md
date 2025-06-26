# Development Tools

Debug and development utility scripts for TCC Log project.

⚠️ **Important**: These tools are for development use only and should not be deployed to production.

## Debug Scripts

### `debug_agent_error.py`
- **Purpose**: Debug PostgreSQL database connection and schema issues
- **Usage**: `python dev-tools/debug_agent_error.py`
- **When to use**: When having database connectivity or SQL tool problems

### `debug_agent_streaming.py`
- **Purpose**: Test and debug AI streaming response format
- **Usage**: `python dev-tools/debug_agent_streaming.py`
- **When to use**: When AI streaming responses are not working correctly

### `debug_agent_tools.py`
- **Purpose**: Direct testing of AI agent tools and execution
- **Usage**: `python dev-tools/debug_agent_tools.py`
- **When to use**: When AI tools are not functioning as expected

## Requirements

These scripts require:
- Active database connection (DATABASE_URL in .env)
- LM Studio running (for AI-related debugging)
- All project dependencies installed

## Security Note

Do not include this directory in production builds or deployments.
Add `dev-tools/` to `.gitignore` if you want to exclude from version control.

## Usage Examples

```bash
# Debug database connection
python dev-tools/debug_agent_error.py

# Test AI streaming
python dev-tools/debug_agent_streaming.py

# Test AI tools directly
python dev-tools/debug_agent_tools.py
```
