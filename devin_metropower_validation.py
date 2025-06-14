#!/usr/bin/env python3
"""
MetroPower Dashboard - Devin AI Validation Script

Quick validation for Devin AI automated testing following
The HigherSelf Network Server project guidelines.

Copyright 2025 The HigherSelf Network
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path


def print_header(title):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")


def print_step(step_num, description):
    """Print formatted step"""
    print(f"\n{step_num}. {description}")
    print("-" * 40)


def run_command(command, cwd=None, env=None, timeout=30):
    """Run command with error handling"""
    try:
        result = subprocess.run(
            command, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except Exception as e:
        return False, "", str(e)


def validate_environment():
    """Validate the development environment"""
    print_step(1, "Validating Environment")

    # Check Node.js
    success, stdout, stderr = run_command(["node", "--version"])
    if success:
        version = stdout.strip()
        print(f"✅ Node.js: {version}")

        # Check version is >= 18
        version_num = int(version.replace("v", "").split(".")[0])
        if version_num < 18:
            print(f"❌ Node.js version {version} is too old. Requires >= 18.0.0")
            return False
    else:
        print("❌ Node.js not found")
        return False

    # Check npm
    success, stdout, stderr = run_command(["npm", "--version"])
    if success:
        print(f"✅ npm: {stdout.strip()}")
    else:
        print("❌ npm not found")
        return False

    return True


def validate_project_structure():
    """Validate project structure"""
    print_step(2, "Validating Project Structure")

    project_root = Path(__file__).parent

    required_files = [
        "package.json",
        "backend/package.json",
        "backend/server.js",
        "backend/src/config/app.js",
        "backend/src/routes/auth.js",
        "backend/src/middleware/auth.js",
        "backend/src/models/User.js",
        "backend/src/utils/logger.js",
        "frontend/index.html",
        "frontend/js/dashboard.js",
        "frontend/js/api.js",
        "frontend/css/dashboard.css",
        "docker-compose.yml",
        "backend/Dockerfile",
    ]

    missing_files = []
    for file_path in required_files:
        full_path = project_root / file_path
        if full_path.exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path}")
            missing_files.append(file_path)

    if missing_files:
        print(f"\n❌ Missing {len(missing_files)} required files")
        return False

    print(f"\n✅ All {len(required_files)} required files found")
    return True


def validate_dependencies():
    """Validate and install dependencies"""
    print_step(3, "Validating Dependencies")

    project_root = Path(__file__).parent
    backend_path = project_root / "backend"

    # Check if node_modules exists
    if not (backend_path / "node_modules").exists():
        print("📦 Installing backend dependencies...")
        success, stdout, stderr = run_command(
            ["npm", "install"], cwd=backend_path, timeout=120
        )
        if success:
            print("✅ Backend dependencies installed")
        else:
            print(f"❌ Failed to install dependencies: {stderr}")
            return False
    else:
        print("✅ Backend dependencies already installed")

    # Validate package.json scripts
    package_json_path = backend_path / "package.json"
    with open(package_json_path, "r") as f:
        package_data = json.load(f)

    required_scripts = ["start", "dev"]
    for script in required_scripts:
        if script in package_data.get("scripts", {}):
            print(f"✅ Script '{script}' found")
        else:
            print(f"❌ Script '{script}' missing")
            return False

    return True


def validate_syntax():
    """Validate JavaScript syntax"""
    print_step(4, "Validating Syntax")

    project_root = Path(__file__).parent
    backend_path = project_root / "backend"

    # Test main server file
    success, stdout, stderr = run_command(["node", "-c", "server.js"], cwd=backend_path)
    if success:
        print("✅ server.js syntax valid")
    else:
        print(f"❌ server.js syntax error: {stderr}")
        return False

    # Test other key files
    key_files = [
        "src/config/app.js",
        "src/routes/auth.js",
        "src/middleware/auth.js",
        "src/models/User.js",
    ]

    for file_path in key_files:
        success, stdout, stderr = run_command(
            ["node", "-c", file_path], cwd=backend_path
        )
        if success:
            print(f"✅ {file_path} syntax valid")
        else:
            print(f"❌ {file_path} syntax error: {stderr}")
            return False

    return True


def test_server_startup():
    """Test server startup in demo mode"""
    print_step(5, "Testing Server Startup")

    project_root = Path(__file__).parent
    backend_path = project_root / "backend"

    # Set test environment
    env = os.environ.copy()
    env.update(
        {
            "TEST_MODE": "true",
            "DISABLE_WEBHOOKS": "true",
            "NODE_ENV": "development",
            "DEMO_MODE_ENABLED": "true",
            "PORT": "3001",
            "LOG_LEVEL": "error",  # Reduce log noise during testing
        }
    )

    print("🚀 Starting server in test mode...")

    try:
        # Start server
        process = subprocess.Popen(
            ["npm", "start"],
            cwd=backend_path,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        # Wait for startup
        time.sleep(8)

        # Check if process is running
        if process.poll() is None:
            print("✅ Server started successfully")

            # Test health endpoint
            try:
                import urllib.error
                import urllib.request

                response = urllib.request.urlopen(
                    "http://localhost:3001/health", timeout=5
                )
                if response.getcode() == 200:
                    print("✅ Health check passed")
                    health_data = json.loads(response.read().decode())
                    print(f"   Status: {health_data.get('status', 'unknown')}")
                    print(f"   Database: {health_data.get('database', 'unknown')}")
                else:
                    print(f"⚠️  Health check returned status: {response.getcode()}")
            except Exception as e:
                print(f"⚠️  Health check failed: {e}")

            # Test API endpoints
            try:
                # Test auth endpoint
                response = urllib.request.urlopen(
                    "http://localhost:3001/api-docs", timeout=5
                )
                if response.getcode() == 200:
                    print("✅ API documentation endpoint accessible")
                else:
                    print(f"⚠️  API docs returned status: {response.getcode()}")
            except Exception as e:
                print(f"⚠️  API docs test failed: {e}")

            # Terminate server
            process.terminate()
            process.wait(timeout=10)
            print("✅ Server terminated cleanly")
            return True

        else:
            stdout, stderr = process.communicate()
            print(f"❌ Server failed to start")
            print(f"   stdout: {stdout.decode()}")
            print(f"   stderr: {stderr.decode()}")
            return False

    except Exception as e:
        print(f"❌ Server startup test failed: {e}")
        try:
            process.terminate()
            process.wait(timeout=5)
        except:
            pass
        return False


def validate_demo_mode():
    """Validate demo mode functionality"""
    print_step(6, "Validating Demo Mode")

    project_root = Path(__file__).parent
    backend_path = project_root / "backend"

    # Check demo service file
    demo_service_path = backend_path / "src" / "services" / "demoService.js"
    if demo_service_path.exists():
        print("✅ Demo service file found")

        # Test syntax
        success, stdout, stderr = run_command(["node", "-c", str(demo_service_path)])
        if success:
            print("✅ Demo service syntax valid")
        else:
            print(f"❌ Demo service syntax error: {stderr}")
            return False
    else:
        print("❌ Demo service file missing")
        return False

    return True


def main():
    """Main validation function"""
    print_header("MetroPower Dashboard - Devin AI Validation")
    print("Following The HigherSelf Network Server project guidelines")
    print("Copyright 2025 The HigherSelf Network")

    validation_steps = [
        ("Environment", validate_environment),
        ("Project Structure", validate_project_structure),
        ("Dependencies", validate_dependencies),
        ("Syntax", validate_syntax),
        ("Server Startup", test_server_startup),
        ("Demo Mode", validate_demo_mode),
    ]

    passed = 0
    total = len(validation_steps)

    for step_name, step_func in validation_steps:
        try:
            if step_func():
                passed += 1
            else:
                print(f"\n❌ {step_name} validation failed")
        except Exception as e:
            print(f"\n❌ {step_name} validation error: {e}")

    print_header("Validation Results")
    print(f"Passed: {passed}/{total} validation steps")

    if passed == total:
        print("🎉 ALL VALIDATIONS PASSED!")
        print("\n✅ MetroPower Dashboard is ready for Devin AI deployment")
        print("\n📋 Next Steps:")
        print("   1. Start development server: cd backend && npm run dev")
        print("   2. Access dashboard: http://localhost:3001")
        print("   3. Login with any credentials (Demo Mode)")
        print("   4. Test all dashboard functionality")
        print("   5. Deploy to production when ready")
        return True
    else:
        print(f"❌ {total - passed} validation(s) failed")
        print("\n🔧 Please fix the issues above before deployment")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
