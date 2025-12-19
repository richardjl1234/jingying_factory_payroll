from app.database import SessionLocal
from app import models, schemas
from app.crud import get_model_list

# Create a database session
db = SessionLocal()
try:
    # Get model list from database
    print('Fetching model list from database...')
    model_list = get_model_list(db, skip=0, limit=10)
    print(f'Got {len(model_list)} models from database')
    
    # Print model objects
    for i, model in enumerate(model_list):
        print(f'Model {i+1}: {model.__dict__}')
    
    # Try to serialize with ProductModel schema
    print('\nTrying to serialize with ProductModel schema...')
    for model in model_list:
        try:
            product_model = schemas.ProductModel.model_validate(model)
            print(f'Successfully serialized: {product_model.name}')
        except Exception as e:
            print(f'Failed to serialize model {model.name}: {e}')
            import traceback
            traceback.print_exc()
finally:
    db.close()
