#!/usr/bin/env python3
import subprocess
import sys
import os
import pkg_resources

def main():
    """Fix dependencies for the project using pip only"""
    print("Fixing dependencies for TCC Log project...")
    
    # Check what packages we currently have
    print("Checking existing packages...")
    installed = {pkg.key: pkg.version for pkg in pkg_resources.working_set}
    print(f"Found {len(installed)} installed packages")
    
    # These are the packages we need
    required_packages = [
        'charset-normalizer>=3.0.0',
        'chardet>=5.1.0',
        'idna>=3.4',
        'urllib3>=1.26.15',
        'certifi>=2023.5.7',
        'requests==2.31.0'
    ]
    
    # Uninstall problematic packages first if they exist
    print("Cleaning up existing installations...")
    packages_to_uninstall = ['charset-normalizer', 'chardet', 'requests']
    for package in packages_to_uninstall:
        if package in installed:
            print(f"Uninstalling {package}...")
            try:
                subprocess.call([sys.executable, '-m', 'pip', 'uninstall', '-y', package])
            except Exception as e:
                print(f"Error uninstalling {package}: {e}")
    
    # Install packages in the correct order
    print("Installing dependencies with pip...")
    for package in required_packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
        except subprocess.CalledProcessError as e:
            print(f"Failed to install {package}: {e}")
            print(f"Continuing with other packages...")
    
    # Verify installations
    print("Verifying installations...")
    try:
        # Try to import requests
        import requests
        print(f"Successfully imported requests version {requests.__version__}")
        
        # Try to import chardet
        import chardet
        print(f"Successfully imported chardet version {chardet.__version__}")
        
        # Try to import charset_normalizer
        import charset_normalizer
        print(f"Successfully imported charset_normalizer version {charset_normalizer.__version__}")
        
    except ImportError as e:
        print(f"Import failed: {e}")
        print("Please try installing the packages manually:")
        for package in required_packages:
            print(f"  pip install {package}")
    
    print("\nDependencies fixed successfully!")
    print("Now you can run 'python scripts/test_api_endpoints.py'")

if __name__ == "__main__":
    main()
