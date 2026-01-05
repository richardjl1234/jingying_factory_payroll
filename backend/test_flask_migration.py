"""
Test script to verify Flask migration
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app

def test_flask_app():
    """Test Flask application creation and route registration"""
    print("Testing Flask application...")
    
    # Create Flask app
    app = create_app('default')
    
    # Test that app was created
    assert app is not None, "Flask app should not be None"
    print("✓ Flask app created successfully")
    
    # Get registered routes
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': sorted(list(rule.methods)),
            'route': str(rule)
        })
    
    print(f"✓ Found {len(routes)} registered routes")
    
    # Check for critical routes
    critical_routes = [
        '/api/auth/login',
        '/api/auth/change-password', 
        '/api/auth/me',
        '/api/users/',
        '/api/users/<user_id>',
        '/api/workers/',
        '/api/workers/<worker_code>',
        '/api/processes/',
        '/api/processes/<process_code>',
        '/api/quotas/',
        '/api/quotas/<quota_id>',
        '/api/salary-records/',
        '/api/salary-records/<record_id>',
        '/api/stats/',
    ]
    
    registered_routes = [r['route'] for r in routes]
    
    for critical_route in critical_routes:
        # Check if route exists (may have different format like <int:user_id>)
        found = False
        for reg_route in registered_routes:
            # Simple check - if the route pattern matches
            if critical_route.replace('<user_id>', '').replace('<worker_code>', '').replace('<process_code>', '').replace('<quota_id>', '').replace('<record_id>', '') in reg_route:
                found = True
                break
        
        if found:
            print(f"✓ Route {critical_route} found")
        else:
            print(f"✗ Route {critical_route} NOT found")
    
    # Test request to auth endpoint
    with app.test_client() as client:
        # Test login endpoint exists and returns 400 (missing credentials)
        response = client.post('/api/auth/login', json={})
        assert response.status_code in [400, 401], f"Login should return 400 or 401, got {response.status_code}"
        print("✓ Login endpoint responding correctly")
    
    print("\n" + "="*50)
    print("Flask migration verification complete!")
    print("="*50)

if __name__ == "__main__":
    test_flask_app()
