import os
import shutil

# Get the directory of this script
script_dir = os.path.dirname(__file__)

# Define file paths relative to the script directory
fixed_agent_path = os.path.join(script_dir, 'app', 'ai', 'fixed_agent.py')
agent_path = os.path.join(script_dir, 'app', 'ai', 'agent.py')

# Copy the fixed agent to replace the original agent
print(f"Copying {fixed_agent_path} to {agent_path}...")
shutil.copy2(fixed_agent_path, agent_path)
print("File copied successfully!")

# Verify file size
agent_size = os.path.getsize(agent_path)
print(f"New agent.py size: {agent_size} bytes")
