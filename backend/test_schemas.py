from app import schemas

print('Checking schemas.Model:')
print(f'Type: {type(schemas.Model)}')
print(f'Attributes: {[attr for attr in dir(schemas.Model) if not attr.startswith("_")]}')
print(f'Base classes: {schemas.Model.__bases__}')

print('\nChecking schemas.SalarySummaryReport:')
print(f'Type: {type(schemas.SalarySummaryReport)}')
print(f'Attributes: {[attr for attr in dir(schemas.SalarySummaryReport) if not attr.startswith("_")]}')

print('\nChecking all schemas:')
for name in dir(schemas):
    if not name.startswith("_"):
        print(f'{name}: {type(getattr(schemas, name))}')
