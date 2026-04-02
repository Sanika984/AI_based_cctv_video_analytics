import requests

BASE_URL = "http://127.0.0.1:8000"

def get_cameras():
    try:
        res = requests.get(f"{BASE_URL}/cameras")
        return res.json()
    except:
        return []

def get_users():
    try:
        res = requests.get(f"{BASE_URL}/users")
        return res.json()
    except:
        return []