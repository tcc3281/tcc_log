#!/usr/bin/env python3
import urllib.parse

# Test URL encoding for the password
password = "Mayyeutao0?"
encoded_password = urllib.parse.quote_plus(password)
print(f"Original password: {password}")
print(f"URL encoded password: {encoded_password}")

# Test the full DATABASE_URL
base_url = "postgresql+psycopg2://postgres:"
host_db = "@127.0.0.1:5432/tcc_log"
full_url = base_url + encoded_password + host_db
print(f"Full DATABASE_URL: {full_url}")

# Test connection with this URL
from sqlalchemy import create_engine, text
try:
    engine = create_engine(full_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✅ Database connection successful!")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
