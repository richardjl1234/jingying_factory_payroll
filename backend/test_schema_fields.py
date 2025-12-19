from app import schemas

print('=== Checking schemas.Model fields ===')
model_fields = schemas.Model.model_fields
print(f'Number of fields: {len(model_fields)}')
for field_name, field_info in model_fields.items():
    print(f'{field_name}: {field_info.type} (required: {field_info.is_required()})')

print('\n=== Checking schemas.SalarySummaryReport fields ===')
salary_summary_fields = schemas.SalarySummaryReport.model_fields
for field_name, field_info in salary_summary_fields.items():
    print(f'{field_name}: {field_info.type} (required: {field_info.is_required()})')
