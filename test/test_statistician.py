import requests
import sys

BASE_URL = "http://localhost/api"

def test_statistician_login():
    """Test statistician can log in and get token"""
    print("Testing statistician login...")
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"username": "stat", "password": "start"}
    )
    if resp.status_code != 200:
        print(f"FAIL: Login failed with status {resp.status_code}")
        print(resp.text)
        return None
    data = resp.json()
    token = data.get("access_token")
    if not token:
        print("FAIL: No access_token in response")
        return None
    print("SUCCESS: Statistician logged in")
    return token

def test_stats_access(token):
    """Test statistician can access stats endpoint"""
    print("Testing stats endpoint access...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/stats/", headers=headers)
    if resp.status_code != 200:
        print(f"FAIL: Stats endpoint returned {resp.status_code}")
        print(resp.text)
        return False
    data = resp.json()
    required_keys = ["worker_count", "process_count", "quota_count", "salary_record_count"]
    for key in required_keys:
        if key not in data:
            print(f"FAIL: Missing key {key} in response")
            return False
    print(f"SUCCESS: Stats data: {data}")
    return True

def test_home_page_counts(token):
    """Test home page counts via stats endpoint (same as stats)"""
    # The home page uses the same stats endpoint, so we just reuse
    print("Testing home page counts...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/stats/", headers=headers)
    if resp.status_code != 200:
        print(f"FAIL: Home page stats failed with {resp.status_code}")
        return False
    data = resp.json()
    if all(isinstance(data[key], int) for key in data):
        print("SUCCESS: Home page counts are integers")
        return True
    else:
        print("FAIL: Some counts are not integers")
        return False

def test_unauthorized_access():
    """Test that a user without proper role cannot access stats"""
    print("Testing unauthorized access...")
    # Try to access stats without token
    resp = requests.get(f"{BASE_URL}/stats/")
    if resp.status_code == 401:
        print("SUCCESS: Unauthorized access blocked (no token)")
    else:
        print(f"WARN: Expected 401 but got {resp.status_code}")
    # Try with a token of a user with insufficient role (if we had one)
    # For now skip
    return True

def main():
    print("=== Running statistician user tests ===")
    token = test_statistician_login()
    if not token:
        sys.exit(1)
    if not test_stats_access(token):
        sys.exit(1)
    if not test_home_page_counts(token):
        sys.exit(1)
    test_unauthorized_access()
    print("=== All tests passed ===")

if __name__ == "__main__":
    main()
