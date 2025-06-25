import os
import sys

# Add the parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the fixed agent
from app.ai.agent import LangChainAgent

def test_agent():
    # Set the environment variable with the URL-encoded password
    os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:Mayyeutao0%3F@localhost:5432/postgres"
    os.environ["LM_STUDIO_MODEL"] = "lmstudio-community/Qwen2.5-7B-Instruct-GGUF"
    
    try:
        print("Creating LangChainAgent...")
        agent = LangChainAgent()
        print("LangChainAgent created successfully!")
        
        # Test a simple query
        print("\nRunning test query: 'Get 2 entries in database'")
        result = agent.query("Get 2 entries in database")
        print("\nResponse:")
        print(result.get("response", "No response"))
        
        if result.get("error"):
            print(f"Error: {result.get('error')}")
        
        return True
    except Exception as e:
        print(f"Error testing agent: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_agent()
