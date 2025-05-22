import requests

url = 'http://127.0.0.1:5000/predict'

data = {
    "ticker": "AAPL",
    "duration": "6 months"
}

try:
    response = requests.post(url, json=data, timeout=10)
    response.raise_for_status()
    print(response.json())
except requests.exceptions.RequestException as e:
    print("❌ Request failed:", e)
