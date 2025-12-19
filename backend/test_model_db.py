from app.database import SessionLocal, engine
from app import models

print('Checking database structure...')

# Create all tables to ensure MotorModel table exists
print('Creating tables if they don\'t exist...')
models.Base.metadata.create_all(bind=engine)

# Use session to check table structure
db = SessionLocal()
try:
    print('\nChecking MotorModel table structure:')
    # Check if we can query the MotorModel table
    motor_model_count = db.query(models.MotorModel).count()
    print(f'Number of MotorModel records: {motor_model_count}')
    
    # Try to create a sample motor model to test functionality
    print('\nTesting MotorModel CRUD operations:')
    test_motor_model = models.MotorModel(name='TEST001', aliases='测试电机型号', description='测试电机型号描述')
    db.add(test_motor_model)
    db.commit()
    print('Created test motor model successfully')
    
    # Verify it was created
    created_motor_model = db.query(models.MotorModel).filter(models.MotorModel.name == 'TEST001').first()
    if created_motor_model:
        print(f'Found created motor model: {created_motor_model.name}')
    
    # Clean up
    db.delete(created_motor_model)
    db.commit()
    print('Deleted test motor model successfully')
    
    print('\n✅ MotorModel table and CRUD operations are working correctly!')
except Exception as e:
    print(f'❌ Error with MotorModel table: {e}')
    import traceback
    traceback.print_exc()
finally:
    db.close()
