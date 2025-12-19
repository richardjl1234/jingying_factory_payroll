from app.main import app

print('=== Checking all registered routes ===')
for route in app.routes:
    if hasattr(route, 'path'):
        print(f'Path: {route.path}, Name: {getattr(route, "name", "N/A")}, Methods: {getattr(route, "methods", "N/A")}')

print('\n=== Checking specific /api/models routes ===')
for route in app.routes:
    if hasattr(route, 'path') and '/api/models' in route.path:
        print(f'Path: {route.path}, Name: {getattr(route, "name", "N/A")}, Methods: {getattr(route, "methods", "N/A")}')
        if hasattr(route, 'response_model'):
            print(f'  Response Model: {route.response_model}')
