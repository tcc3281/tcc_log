#!/usr/bin/env python3
"""
Test script để kiểm tra Prompt Manager
"""
import sys
import os

# Add the parent directory to the path to import the modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ai.prompt_manager import get_prompt_manager, get_system_prompt, get_sql_prompt

def test_prompt_manager():
    """Test các chức năng của prompt manager"""
    print("🧪 Testing Prompt Manager...")
    
    # Test 1: Load prompts
    print("\n1. Testing prompt loading...")
    pm = get_prompt_manager()
    print(f"✅ Loaded prompts successfully")
    
    # Test 2: Get system prompt
    print("\n2. Testing system prompts...")
    default_chat = get_system_prompt("default_chat")
    print(f"✅ Default chat prompt (length: {len(default_chat)})")
    print(f"Preview: {default_chat[:100]}...")
    
    # Test 3: Get analysis prompts
    print("\n3. Testing analysis prompts...")
    for analysis_type in ["general", "mood", "summary", "insights"]:
        prompt = pm.get_analysis_prompt(analysis_type)
        print(f"✅ {analysis_type} analysis prompt (length: {len(prompt)})")
    
    # Test 4: Get writing improvement prompts
    print("\n4. Testing writing improvement prompts...")
    for improvement_type in ["grammar", "style", "vocabulary", "complete"]:
        prompt = pm.get_writing_improvement_prompt(improvement_type)
        print(f"✅ {improvement_type} improvement prompt (length: {len(prompt)})")
    
    # Test 5: Get SQL prompt
    print("\n5. Testing SQL prompt generation...")
    sample_schema = """
Table: users
Columns:
  - id: integer (PK) (nullable: NO)
  - username: varchar(50) (nullable: NO)
  - email: varchar(100) (nullable: NO)
  - created_at: timestamp (nullable: YES)

Table: posts
Columns:
  - id: integer (PK) (nullable: NO)
  - user_id: integer (nullable: NO)
  - title: varchar(200) (nullable: NO)
  - content: text (nullable: YES)
Foreign Keys:
  - user_id -> users.id
"""
    
    sql_prompt = get_sql_prompt(sample_schema)
    print(f"✅ SQL prompt generated (length: {len(sql_prompt)})")
    print(f"Preview: {sql_prompt[:200]}...")
    
    # Test 6: List available prompts
    print("\n6. Testing prompt listing...")
    available = pm.list_available_prompts()
    for category, keys in available.items():
        print(f"✅ Category '{category}': {len(keys)} prompts")
        for key in keys[:3]:  # Show first 3 keys
            print(f"   - {key}")
        if len(keys) > 3:
            print(f"   ... and {len(keys) - 3} more")
    
    # Test 7: Test empty schema handling
    print("\n7. Testing empty schema handling...")
    empty_sql_prompt = get_sql_prompt("")
    print(f"✅ Empty schema SQL prompt (length: {len(empty_sql_prompt)})")
    
    print("\n🎉 All tests passed!")

def test_prompt_update():
    """Test cập nhật prompt"""
    print("\n🔧 Testing prompt update functionality...")
    
    pm = get_prompt_manager()
    
    # Test update
    test_key = "test_prompt"
    test_value = "This is a test prompt for validation."
    
    success = pm.update_prompt("system_prompts", test_key, test_value)
    if success:
        print(f"✅ Successfully updated prompt '{test_key}'")
        
        # Verify update
        retrieved = pm.get_system_prompt(test_key)
        if retrieved == test_value:
            print(f"✅ Update verified: prompt retrieved correctly")
        else:
            print(f"❌ Update failed: expected '{test_value}', got '{retrieved}'")
    else:
        print(f"❌ Failed to update prompt '{test_key}'")

if __name__ == "__main__":
    test_prompt_manager()
    test_prompt_update()
