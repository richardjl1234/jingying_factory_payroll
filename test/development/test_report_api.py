#!/usr/bin/env python3
"""Test script for the report API"""

import sys
sys.path.insert(0, '/home/richard/shared/jianglei/trae/new_payroll/backend')

from app.database import SessionLocal
from app.api.report import get_worker_salary_report


def test_worker_salary_report():
    """Test the worker salary report API"""
    db = SessionLocal()

    print("=" * 50)
    print("Testing Worker Salary Report API")
    print("=" * 50)

    # Test 1: Single worker
    print("\n[Test 1] Single worker (worker_code='001', month='2026-02')")
    try:
        result = get_worker_salary_report('001', '2026-02', db, None)
        print(f"  Status: SUCCESS")
        print(f"  Worker: {result['worker_name']}")
        print(f"  Total Amount: {result['total_amount']}")
        print(f"  Number of records: {len(result['details'])}")
        if result['details']:
            print(f"  First record: {result['details'][0]}")
    except Exception as e:
        print(f"  Status: FAILED")
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()

    # Test 2: All workers
    print("\n[Test 2] All workers (worker_code='all', month='2026-02')")
    try:
        result = get_worker_salary_report('all', '2026-02', db, None)
        print(f"  Status: SUCCESS")
        print(f"  Worker: {result['worker_name']}")
        print(f"  Total Amount: {result['total_amount']}")
        print(f"  Number of records: {len(result['details'])}")
        if result['details']:
            print(f"  First record: {result['details'][0]}")
    except Exception as e:
        print(f"  Status: FAILED")
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()

    # Test 3: Different month
    print("\n[Test 3] Single worker with different month (worker_code='001', month='2026-01')")
    try:
        result = get_worker_salary_report('001', '2026-01', db, None)
        print(f"  Status: SUCCESS")
        print(f"  Worker: {result['worker_name']}")
        print(f"  Total Amount: {result['total_amount']}")
        print(f"  Number of records: {len(result['details'])}")
    except Exception as e:
        print(f"  Status: FAILED")
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()

    db.close()
    print("\n" + "=" * 50)
    print("All tests completed")
    print("=" * 50)


if __name__ == "__main__":
    test_worker_salary_report()
