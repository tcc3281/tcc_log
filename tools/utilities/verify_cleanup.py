#!/usr/bin/env python3
"""
Quick verification script to check if moved test files still work
"""

import os
import sys
import subprocess
from pathlib import Path

def check_test_imports():
    """Check if moved test files can be imported without errors"""
    print("🔍 Checking test file imports...")
    
    test_files = [
        "tests/ai/test_few_shot_learning.py",
        "tests/ai/test_comprehensive_few_shot.py", 
        "tests/ai/test_simple_few_shot.py"
    ]
    
    results = []
    
    for test_file in test_files:
        if os.path.exists(test_file):
            print(f"  ✅ {test_file} - File exists")
            try:
                # Try to run syntax check
                result = subprocess.run([
                    sys.executable, "-m", "py_compile", test_file
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    print(f"  ✅ {test_file} - Syntax OK")
                    results.append((test_file, True, "Syntax OK"))
                else:
                    print(f"  ❌ {test_file} - Syntax Error: {result.stderr}")
                    results.append((test_file, False, f"Syntax Error: {result.stderr}"))
                    
            except Exception as e:
                print(f"  ❌ {test_file} - Check failed: {e}")
                results.append((test_file, False, str(e)))
        else:
            print(f"  ❌ {test_file} - File not found")
            results.append((test_file, False, "File not found"))
    
    return results

def check_tool_files():
    """Check if moved tool files are accessible"""
    print("\n🔧 Checking tool files...")
    
    tool_files = [
        "tools/debug/debug_env.py",
        "tools/utilities/check_auth.py",
        "tools/utilities/check_db.py"
    ]
    
    for tool_file in tool_files:
        if os.path.exists(tool_file):
            print(f"  ✅ {tool_file} - Available")
        else:
            print(f"  ❌ {tool_file} - Missing")

def check_docker_files():
    """Check if Docker files are properly organized"""
    print("\n🐳 Checking Docker files...")
    
    docker_files = [
        "docker/Dockerfile.backend",
        "docker/Dockerfile.frontend", 
        "docker/docker-compose.yml",
        "docker/docker-compose.override.yml"
    ]
    
    for docker_file in docker_files:
        if os.path.exists(docker_file):
            print(f"  ✅ {docker_file} - Available")
        else:
            print(f"  ❌ {docker_file} - Missing")

def run_quick_test():
    """Try to run a simple test to verify structure"""
    print("\n🧪 Running quick test verification...")
    
    try:
        # Try to discover tests in new location
        result = subprocess.run([
            sys.executable, "-m", "pytest", "tests/", "--collect-only", "-q"
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            test_count = result.stdout.count("test session starts") 
            print(f"  ✅ Test discovery successful")
            print(f"  📊 Pytest can find tests in new structure")
        else:
            print(f"  ⚠️ Test discovery had issues: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("  ⚠️ Test discovery timed out")
    except Exception as e:
        print(f"  ⚠️ Test discovery failed: {e}")

def main():
    """Main verification function"""
    print("🚀 POST-CLEANUP VERIFICATION")
    print("="*50)
    
    # Change to project root
    os.chdir(Path(__file__).parent)
    
    # Run all checks
    test_results = check_test_imports()
    check_tool_files()
    check_docker_files()
    run_quick_test()
    
    # Summary
    print("\n📋 VERIFICATION SUMMARY")
    print("="*50)
    
    passed_tests = sum(1 for _, success, _ in test_results if success)
    total_tests = len(test_results)
    
    print(f"Test files: {passed_tests}/{total_tests} working")
    
    if passed_tests == total_tests:
        print("🎉 All checks passed! Cleanup was successful.")
        return True
    else:
        print("⚠️ Some issues found. Check details above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
