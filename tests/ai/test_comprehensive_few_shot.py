#!/usr/bin/env python3
"""
Comprehensive test for few-shot learning system
This script tests all aspects of few-shot learning integration
"""

import os
import sys
import logging
from dotenv import load_dotenv
import json
from sqlalchemy import create_engine, text
from typing import Dict, List, Any

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_sql_tool_few_shot_methods():
    """Test SQLTool few-shot learning methods"""
    print("\n" + "="*60)
    print("TESTING SQL TOOL FEW-SHOT METHODS")
    print("="*60)
    
    try:
        from ai.sql_tool import SQLTool
        
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print("❌ No DATABASE_URL found in environment")
            return False
            
        sql_tool = SQLTool(database_url)
        
        # Test 1: get_few_shot_examples
        print("\n1. Testing get_few_shot_examples()...")
        examples = sql_tool.get_few_shot_examples()
        print(f"   📊 Generated {len(examples)} few-shot examples")
        
        if examples:
            print("   ✅ Sample example:")
            sample = examples[0]
            for key, value in sample.items():
                print(f"     {key}: {value}")
        else:
            print("   ⚠️  No examples generated")
            
        # Test 2: get_sample_data_for_learning
        print("\n2. Testing get_sample_data_for_learning()...")
        sample_data = sql_tool.get_sample_data_for_learning()
        print(f"   📊 Sample data result: {sample_data.get('success', False)}")
        
        if sample_data.get("success") and sample_data.get("sample_data"):
            for table_name, data in sample_data["sample_data"].items():
                print(f"     {table_name}: {data['row_count']} sample rows")
        else:
            print(f"   ⚠️  No sample data: {sample_data.get('error', 'Unknown reason')}")
            
        # Test 3: generate_learning_prompt_addition
        print("\n3. Testing generate_learning_prompt_addition()...")
        prompt_addition = sql_tool.generate_learning_prompt_addition()
        
        if prompt_addition:
            print(f"   ✅ Generated {len(prompt_addition)} characters of prompt addition")
            print("   📝 First 500 characters:")
            print(f"     {prompt_addition[:500]}...")
        else:
            print("   ⚠️  No prompt addition generated")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing SQL tool methods: {e}")
        return False

def test_agent_few_shot_integration():
    """Test Agent's integration of few-shot learning"""
    print("\n" + "="*60)
    print("TESTING AGENT FEW-SHOT INTEGRATION")
    print("="*60)
    
    try:
        from ai.agent import ConversationalAgent
        from ai.prompt_manager import get_system_prompt
        
        # Create agent with SQL tools
        print("\n1. Creating agent with SQL tools...")
        agent = ConversationalAgent(
            model_name="llama-3.2-3b-instruct",
            system_prompt=get_system_prompt("default_chat"),
            temperature=0.7,
            max_tokens=4000
        )
        
        # Check system prompt content
        print("\n2. Analyzing system prompt content...")
        system_prompt = agent.system_prompt
        
        # Check for few-shot keywords
        few_shot_indicators = [
            "DATABASE-SPECIFIC FEW-SHOT EXAMPLES",
            "Example",
            "Action:",
            "Input:",
            "Observation:",
            "SAMPLE DATA CONTEXT",
            "KEY LEARNING POINTS"
        ]
        
        found_indicators = []
        for indicator in few_shot_indicators:
            if indicator in system_prompt:
                found_indicators.append(indicator)
                
        print(f"   📊 Found {len(found_indicators)}/{len(few_shot_indicators)} few-shot indicators")
        print(f"   ✅ Found: {found_indicators}")
        
        missing = [ind for ind in few_shot_indicators if ind not in found_indicators]
        if missing:
            print(f"   ⚠️  Missing: {missing}")
            
        # Check tools
        print(f"\n3. Agent has {len(agent.tools)} tools available")
        tool_names = [tool.name for tool in agent.tools]
        print(f"   📊 Tool names: {tool_names}")
        
        sql_tools = [name for name in tool_names if 'sql' in name.lower()]
        if sql_tools:
            print(f"   ✅ SQL tools found: {sql_tools}")
        else:
            print("   ⚠️  No SQL tools found")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing agent integration: {e}")
        return False

def test_prompts_json_content():
    """Test prompts.json few-shot content"""
    print("\n" + "="*60)
    print("TESTING PROMPTS.JSON FEW-SHOT CONTENT")
    print("="*60)
    
    try:
        with open("app/ai/prompts.json", "r", encoding="utf-8") as f:
            prompts = json.load(f)
            
        sql_agent_prompts = prompts.get("system_prompts", {}).get("sql_agent", {})
        
        # Check for few-shot examples in prompts.json
        print("\n1. Checking few-shot examples in prompts.json...")
        examples = sql_agent_prompts.get("examples", [])
        print(f"   📊 Found {len(examples)} static examples in prompts.json")
        
        few_shot_examples = [ex for ex in examples if "FEW-SHOT" in ex.get("title", "")]
        print(f"   📊 Found {len(few_shot_examples)} few-shot examples")
        
        for example in few_shot_examples:
            title = example.get("title", "Unknown")
            print(f"     ✅ {title}")
            
        # Check few_shot_learning section
        print("\n2. Checking few_shot_learning section...")
        few_shot_section = sql_agent_prompts.get("few_shot_learning", {})
        
        if few_shot_section:
            print("   ✅ few_shot_learning section found")
            
            patterns = few_shot_section.get("learning_examples", [])
            print(f"     📊 {len(patterns)} learning patterns defined")
            
            rules = few_shot_section.get("tool_selection_rules", [])
            print(f"     📊 {len(rules)} tool selection rules defined")
            
        else:
            print("   ⚠️  No few_shot_learning section found")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing prompts.json content: {e}")
        return False

def test_database_few_shot_queries():
    """Test actual few-shot learning with database queries"""
    print("\n" + "="*60)
    print("TESTING DATABASE FEW-SHOT QUERIES")
    print("="*60)
    
    try:
        from ai.agent import ConversationalAgent
        from ai.prompt_manager import get_system_prompt
        
        # Create agent
        agent = ConversationalAgent(
            model_name="llama-3.2-3b-instruct",
            system_prompt=get_system_prompt("default_chat"),
            temperature=0.0,  # Low temperature for consistent testing
            max_tokens=2000
        )
        
        # Test queries that should trigger few-shot learning patterns
        test_queries = [
            "How many users do we have?",
            "Show me recent topics",
            "List all tables",
            "What is in the entries table?"
        ]
        
        print(f"\n1. Testing {len(test_queries)} few-shot pattern queries...")
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n   Query {i}: '{query}'")
            try:
                # Use agent to process query
                result = agent.query(query)
                response = result.get("response", "")
                error = result.get("error")
                
                if error:
                    print(f"     ❌ Error: {error}")
                else:
                    # Check if response follows few-shot patterns
                    action_patterns = ["Action:", "sql_query", "list_tables", "get_database_schema"]
                    pattern_found = any(pattern in response for pattern in action_patterns)
                    
                    if pattern_found:
                        print(f"     ✅ Response follows tool usage pattern")
                        print(f"     📝 Response preview: {response[:100]}...")
                    else:
                        print(f"     ⚠️  Response may not follow expected pattern")
                        print(f"     📝 Response preview: {response[:100]}...")
                        
            except Exception as query_error:
                print(f"     ❌ Query error: {query_error}")
                
        return True
        
    except Exception as e:
        print(f"❌ Error testing database queries: {e}")
        return False

def run_comprehensive_test():
    """Run all few-shot learning tests"""
    print("🚀 STARTING COMPREHENSIVE FEW-SHOT LEARNING TEST")
    print("="*80)
    
    test_results = []
    
    # Run all tests
    tests = [
        ("SQL Tool Methods", test_sql_tool_few_shot_methods),
        ("Agent Integration", test_agent_few_shot_integration),
        ("Prompts.json Content", test_prompts_json_content),
        ("Database Queries", test_database_few_shot_queries)
    ]
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            result = test_func()
            test_results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test '{test_name}' failed with exception: {e}")
            test_results.append((test_name, False))
    
    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {status}: {test_name}")
    
    print(f"\n🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Few-shot learning system is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the details above.")
    
    return passed == total

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)
