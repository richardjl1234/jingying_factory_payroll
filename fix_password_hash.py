#!/usr/bin/env python3
"""
Fix password hash for test user with correct PBKDF2-SHA256 format.
"""

import os
import sys
import base64
import hashlib

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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
    
    # Load environment variables
    env_file = os.path.expanduser("~/shared/jianglei/payroll/env_cloud.sh")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if line.strip() and not line.strip().startswith('#') and '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
    
    # Get database URL from environment
    mysql_db_url = os.environ.get('MYSQL_DB_URL')
    if not mysql_db_url:
        # Try local env as fallback
        local_env = os.path.expanduser("~/shared/jianglei/payroll/env_local.sh")
        if os.path.exists(local_env):
            with open(local_env) as f:
                for line in f:
                    if line.strip() and not line.strip().startswith('#') and '=' in line:
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
        mysql_db_url = os.environ.get('MYSQL_DB_URL')
    
    if not mysql_db_url:
        print("Error: MYSQL_DB_URL environment variable not set!")
        print("Please run: source ~/shared/jianglei/payroll/env_local.sh")
        sys.exit(1)
    
    print(f"Using database: {mysql_db_url.split('@')[0]}@...")
    
    # Connect to database
    engine = create_engine(mysql_db_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    # Get current hash to see format
    result = session.execute(
        "SELECT password FROM users WHERE username='test'"
    ).fetchone()
    
    if not result:
        print("Error: User 'test' not found!")
        session.close()
        sys.exit(1)
    
    current_hash = result[0]
    print(f"Current hash: {current_hash[:80]}...")
    
    # Create proper hash for password 'test123'
    proper_hash = create_proper_pbkdf2_hash("test123")
    print(f"New proper hash: {proper_hash[:80]}...")
    
    # Update database
    session.execute(
        "UPDATE users SET password=? WHERE username='test'",
        (proper_hash,)
    )
    session.commit()
    
    # Verify
    result = session.execute(
        "SELECT password FROM users WHERE username='test'"
    ).fetchone()
    updated_hash = result[0]
    session.close()
    
    print(f"Updated hash in DB: {updated_hash[:80]}...")
    print("\n✅ Password hash fixed in MySQL database.")
    print("Test login with: username='test', password='test123'")

if __name__ == "__main__":
    main()
