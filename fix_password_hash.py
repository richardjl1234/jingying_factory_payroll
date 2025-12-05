#!/usr/bin/env python3
"""
Fix password hash for test user with correct PBKDF2-SHA256 format.
"""

import sqlite3
import base64
import hashlib
import os

def create_proper_pbkdf2_hash(password: str, salt: bytes = None) -> str:
    """Create a properly formatted PBKDF2-SHA256 hash"""
    if salt is None:
        salt = os.urandom(16)
    
    # PBKDF2 with SHA256, 29000 iterations (matching original)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 29000)
    
    # Format: $pbkdf2-sha256$29000$<salt_b64>$<hash_b64>
    salt_b64 = base64.b64encode(salt).decode('ascii')
    hash_b64 = base64.b64encode(dk).decode('ascii')
    
    return f"$pbkdf2-sha256$29000${salt_b64}${hash_b64}"

def main():
    print("Fixing test user password hash...")
    
    # Connect to database
    conn = sqlite3.connect("payroll.db")
    cursor = conn.cursor()
    
    # Get current hash to see format
    cursor.execute("SELECT password FROM users WHERE username='test'")
    current_hash = cursor.fetchone()[0]
    print(f"Current hash: {current_hash[:80]}...")
    
    # Create proper hash for password 'test123'
    proper_hash = create_proper_pbkdf2_hash("test123")
    print(f"New proper hash: {proper_hash[:80]}...")
    
    # Update database
    cursor.execute(
        "UPDATE users SET password=? WHERE username='test'",
        (proper_hash,)
    )
    conn.commit()
    
    # Verify
    cursor.execute("SELECT password FROM users WHERE username='test'")
    updated_hash = cursor.fetchone()[0]
    conn.close()
    
    print(f"Updated hash in DB: {updated_hash[:80]}...")
    
    # Copy to container
    print("\nCopying to container...")
    os.system("docker cp payroll.db payroll-system-https:/app/payroll.db")
    os.system("docker restart payroll-system-https")
    
    print("\n✅ Password hash fixed and container restarted.")
    print("Test login with: username='test', password='test123'")
    
    # Also create a simple test
    print("\nTo test, run:")
    print("curl -X POST http://localhost:8000/api/auth/login \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"username\": \"test\", \"password\": \"test123\"}'")

if __name__ == "__main__":
    main()
