from app.main import app

print('=== All Registered Routes ===')
for route in app.routes:
    if hasattr(route, 'path') and '/api/' in route.path:
        print(f'Path: {route.path}')
