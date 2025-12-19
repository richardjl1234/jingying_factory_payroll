import requests
import json

# Login to get access token
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "username": "test",
    "password": "test123"
}

print("Logging in...")
response = requests.post(login_url, json=login_data)
if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"Login successful, token: {token}")
    
    # Test models endpoint
    models_url = "http://localhost:8000/api/models/"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    print("\nTesting models endpoint...")
    models_response = requests.get(models_url, headers=headers)
    print(f"Status code: {models_response.status_code}")
    print(f"Response headers: {models_response.headers}")
    print(f"Response content: {models_response.text}")
else:
    print(f"Login failed with status code: {response.status_code}")
    print(f"Login response: {response.text}")
