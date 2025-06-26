#!/usr/bin/env python3
"""
Installation script for TCC Log development dependencies
Installs packages in batches to avoid conflicts
"""

import subprocess
import sys
from typing import List

def install_packages(packages: List[str], description: str = ""):
    """Install a list of packages"""
    print(f"\n🔧 Installing {description}...")
    try:
        cmd = [sys.executable, "-m", "pip", "install"] + packages
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ {description} installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing {description}:")
        print(f"   {e.stderr}")
        return False

def main():
    """Main installation process"""
    print("🚀 TCC Log Development Environment Setup")
    print("=" * 50)
    
    # Core testing framework
    testing_packages = [
        "pytest>=7.4.0",
        "pytest-asyncio>=0.21.0", 
        "pytest-cov>=4.1.0",
        "pytest-mock>=3.11.0",
        "pytest-xdist>=3.3.0",
        "pytest-html>=3.2.0"
    ]
    
    # Code quality tools
    quality_packages = [
        "black>=23.7.0",
        "isort>=5.12.0", 
        "flake8>=6.0.0",
        "mypy>=1.5.0",
        "bandit>=1.7.5",
        "safety>=2.3.0"
    ]
    
    # Development tools
    dev_packages = [
        "ipython>=8.15.0",
        "rich>=13.7.0",
        "python-dotenv>=1.0.0",
        "requests>=2.31.0",
        "httpx>=0.24.1"
    ]
    
    # Documentation tools
    docs_packages = [
        "sphinx>=7.1.0",
        "myst-parser>=2.0.0"
    ]
    
    # Advanced testing utilities (install separately due to potential conflicts)
    advanced_test_packages = [
        "pytest-env>=0.8.2",
        "pytest-sugar>=0.9.7",
        "pytest-timeout>=2.1.0",
        "freezegun>=1.2.2",
        "responses>=0.23.3"
    ]
    
    # Database utilities
    db_packages = [
        "alembic>=1.11.1",
        "factory-boy>=3.3.0",
        "faker>=19.6.0"
    ]
    
    # Performance tools (install last due to compilation requirements)
    performance_packages = [
        "memory-profiler>=0.61.0",
        "locust>=2.17.0"
    ]
    
    # Installation sequence
    install_sequence = [
        (testing_packages, "Core Testing Framework"),
        (quality_packages, "Code Quality Tools"),
        (dev_packages, "Development Tools"),
        (docs_packages, "Documentation Tools"),
        (db_packages, "Database Utilities"),
        (advanced_test_packages, "Advanced Testing Utilities"),
        (performance_packages, "Performance Tools")
    ]
    
    success_count = 0
    total_batches = len(install_sequence)
    
    for packages, description in install_sequence:
        if install_packages(packages, description):
            success_count += 1
        else:
            print(f"⚠️  Continuing with next batch...")
    
    print("\n" + "=" * 50)
    print(f"📊 Installation Summary: {success_count}/{total_batches} batches successful")
    
    if success_count == total_batches:
        print("🎉 All development dependencies installed successfully!")
        print("\n📋 Next steps:")
        print("   1. Copy env.example to .env")
        print("   2. Configure your database settings")
        print("   3. Run: make migrate")
        print("   4. Run: make dev")
    else:
        print("⚠️  Some packages failed to install. Check the errors above.")
        print("   You can install failed packages manually using pip.")
    
    return success_count == total_batches

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
