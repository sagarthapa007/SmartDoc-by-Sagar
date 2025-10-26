"""
SmartDoc Enterprise – Full Stack Verifier
Checks:
1️⃣ Render backend health endpoint
2️⃣ Supabase connection & table query
3️⃣ Vercel frontend availability
"""

import os
import sys

import requests
from colorama import Fore, Style, init
from supabase import create_client

# ─────────────────────────────
# ⚙️ CONFIGURATION (Edit if needed)
# ─────────────────────────────
BACKEND_URL = "https://smartdoc-e9xw.onrender.com"
FRONTEND_URL = "https://smart-doc-by-sagar.vercel.app"
SUPABASE_URL = "https://yupiyknziafvheyrzahh.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cGl5a256aWFmdmhleXJ6YWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzQ0OTgsImV4cCI6MjA3NjY1MDQ5OH0.I2foPd9IyTwLElunAH7mOE9Xf6diEBjqg7i2qccE1cU"
TABLE_NAME = "profiles"
HEALTH_PATH = "/api/health"

# ─────────────────────────────
# 🧩 SETUP
# ─────────────────────────────
init(autoreset=True)


def print_status(title, ok, msg=""):
    symbol = f"{Fore.GREEN}✅" if ok else f"{Fore.RED}❌"
    print(f"{symbol} {Style.BRIGHT}{title}{Style.RESET_ALL} {msg}")


# ─────────────────────────────
# 1️⃣ CHECK BACKEND
# ─────────────────────────────
def check_backend():
    try:
        res = requests.get(f"{BACKEND_URL}{HEALTH_PATH}", timeout=10)
        if res.status_code == 200:
            print_status("Render Backend", True, f"→ {res.json()}")
        else:
            print_status("Render Backend", False, f"(HTTP {res.status_code})")
    except Exception as e:
        print_status("Render Backend", False, str(e))


# ─────────────────────────────
# 2️⃣ CHECK SUPABASE (direct REST)
# ─────────────────────────────
def check_supabase():
    try:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        }
        url = f"{SUPABASE_URL}/rest/v1/{TABLE_NAME}?limit=1"
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            rows = res.json()
            print_status("Supabase", True, f"→ {len(rows)} rows fetched from '{TABLE_NAME}'")
        else:
            print_status("Supabase", False, f"HTTP {res.status_code}: {res.text}")
    except Exception as e:
        print_status("Supabase", False, str(e))


# ─────────────────────────────
# 3️⃣ CHECK FRONTEND
# ─────────────────────────────
def check_frontend():
    try:
        res = requests.get(FRONTEND_URL, timeout=10)
        if res.status_code == 200:
            print_status("Vercel Frontend", True, f"→ HTTP 200 OK")
        else:
            print_status("Vercel Frontend", False, f"(HTTP {res.status_code})")
    except Exception as e:
        print_status("Vercel Frontend", False, str(e))


# ─────────────────────────────
# 🚀 RUN TESTS
# ─────────────────────────────
def main():
    print(f"\n{Fore.CYAN}{Style.BRIGHT}🔍 SmartDoc Enterprise Stack Verification\n")
    check_backend()
    check_supabase()
    check_frontend()
    print(f"\n{Fore.CYAN}{Style.BRIGHT}✨ Verification complete.\n")


if __name__ == "__main__":
    main()
