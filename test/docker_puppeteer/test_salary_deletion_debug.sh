#!/bin/bash

echo "=== Debugging Salary Record Deletion ==="
echo ""

# Get auth token
echo "1. Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}' | \
  python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to get auth token"
    exit 1
fi
echo "✓ Got auth token"

# Get list of salary records
echo ""
echo "2. Getting list of salary records..."
SALARY_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/salary-records/)
SALARY_COUNT=$(echo "$SALARY_RESPONSE" | python -c "import sys, json; data=json.load(sys.stdin); print(len(data))")
echo "Found $SALARY_COUNT salary records"

if [ "$SALARY_COUNT" -eq "0" ]; then
    echo "ERROR: No salary records found to test deletion"
    exit 1
fi

# Get first salary record ID
FIRST_RECORD_ID=$(echo "$SALARY_RESPONSE" | python -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'])")
FIRST_RECORD_WORKER=$(echo "$SALARY_RESPONSE" | python -c "import sys, json; data=json.load(sys.stdin); print(data[0]['worker_code'])")
FIRST_RECORD_QUOTA=$(echo "$SALARY_RESPONSE" | python -c "import sys, json; data=json.load(sys.stdin); print(data[0]['quota_id'])")
echo "First salary record: ID=$FIRST_RECORD_ID, Worker=$FIRST_RECORD_WORKER, Quota=$FIRST_RECORD_QUOTA"

# Get detailed info about the record
echo ""
echo "3. Getting detailed info about salary record ID=$FIRST_RECORD_ID..."
DETAIL_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/salary-records/$FIRST_RECORD_ID)
echo "Detail response: $DETAIL_RESPONSE"

# Test deletion with verbose output
echo ""
echo "4. Testing deletion of salary record ID=$FIRST_RECORD_ID..."
echo "Sending DELETE request to: http://localhost:8000/api/salary-records/$FIRST_RECORD_ID"
DELETE_RESPONSE=$(curl -v -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/salary-records/$FIRST_RECORD_ID 2>&1 | grep -A 10 "HTTP\|DELETE\|{" | head -20)
echo "Delete response details:"
echo "$DELETE_RESPONSE"

# Check if deletion was successful
echo ""
echo "5. Checking if deletion was successful..."
VERIFY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/salary-records/$FIRST_RECORD_ID)

if [ "$VERIFY_RESPONSE" == "404" ]; then
    echo "✓ SUCCESS: Salary record successfully deleted (HTTP 404)"
    echo ""
    echo "=== Debug Summary ==="
    echo "The delete_salary_record function is working correctly!"
    echo "1. Salary record with ID $FIRST_RECORD_ID was deleted"
    echo "2. No foreign key constraint issues"
    exit 0
else
    echo "✗ FAIL: Salary record still exists (HTTP $VERIFY_RESPONSE)"
    echo ""
    echo "=== Debug Summary ==="
    echo "The delete_salary_record function may have issues."
    echo "Check the backend logs for more details."
    
    # Try to get more error details
    echo ""
    echo "6. Getting error details..."
    ERROR_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/salary-records/$FIRST_RECORD_ID)
    echo "Current record data: $ERROR_RESPONSE"
    exit 1
fi
