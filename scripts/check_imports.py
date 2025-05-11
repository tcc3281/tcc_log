#!/usr/bin/env python3

def check_import(module_name):
    """Try to import a module and report success/failure"""
    try:
        __import__(module_name)
        print(f"✓ Successfully imported {module_name}")
        return True
    except ImportError as e:
        print(f"✗ Failed to import {module_name}: {e}")
        return False

def main():
    """Check if we can import all required modules"""
    print("Testing imports...")
    
    modules_to_check = [
        'requests',
        'chardet',
        'charset_normalizer',
        'urllib3',
        'idna',
        'certifi'
    ]
    
    all_success = True
    for module in modules_to_check:
        if not check_import(module):
            all_success = False
    
    if all_success:
        print("\nAll imports successful! You can now run the test script.")
    else:
        print("\nSome imports failed. Please fix the dependencies first.")

if __name__ == "__main__":
    main()
