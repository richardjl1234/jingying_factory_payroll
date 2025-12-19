import requests
import json

# Base URL
base_url = "http://localhost:8000"

# Login to get token
login_url = f"{base_url}/api/auth/login"
login_data = {
    "username": "test",
    "password": "test123"
}

print("Logging in...")
login_response = requests.post(login_url, json=login_data)
if login_response.status_code == 200:
    token = login_response.json()["access_token"]
    print(f"Login successful, token: {token}")
    
    # Test the motor-models endpoint
    motor_models_url = f"{base_url}/api/motor-models/"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    print("\nTesting /api/motor-models/ endpoint...")
    motor_models_response = requests.get(motor_models_url, headers=headers)
    print(f"Status code: {motor_models_response.status_code}")
    print(f"Response: {motor_models_response.text}")
else:
    print(f"Login failed: {login_response.status_code}")
    print(f"Response: {login_response.text}")