# Test script to check what schemas.Model actually refers to
from app.api import model

print('=== Checking model.py imports ===')
print(f'model.router: {model.router}')
print(f'model.router.prefix: {model.router.prefix}')
print(f'model.schemas: {model.schemas}')
print(f'model.schemas.Model: {model.schemas.Model}')
print(f'model.schemas.Model.__name__: {model.schemas.Model.__name__}')
print(f'model.schemas.Model.__module__: {model.schemas.Model.__module__}')

# Check all attributes in schemas
print('\n=== All attributes in model.schemas ===')
for attr in dir(model.schemas):
    if not attr.startswith('_'):
        print(f'{attr}: {type(getattr(model.schemas, attr))}')
