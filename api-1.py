#extract one by one data from alpha vantage
'''
import requests
url = 'https://www.alphavantage.co/query?function=HISTORICAL_OPTIONS&symbol=AAPL&apikey=M5LR5HA7I74V9GAE'
r = requests.get(url)
data = r.json()

print(data)

https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&outputsize=full&apikey=M5LR5HA7I74V9GAE&datatype=csv
https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=MSFT&outputsize=full&apikey=M5LR5HA7I74V9GAE&datatype=csv
https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=MSFT&outputsize=full&apikey=M5LR5HA7I74V9GAE&datatype=csv
'''

from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

# Alpha Vantage API key
API_KEY = "M5LR5HA7I74V9GAE"
BASE_URL = "https://www.alphavantage.co/query"

@app.route('/api/stock/<ticker>', methods=['GET'])
def get_stock_data(ticker):
    try:
        # Parameters for the Alpha Vantage API
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": ticker.upper(),
            "outputsize": "full",
            "apikey": API_KEY
        }
        
        # Make request to Alpha Vantage API
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse the JSON response
        data = response.json()
        
        # Check if the API returned an error
        if "Error Message" in data:
            return jsonify({
                "error": "Invalid ticker symbol or API error",
                "message": data["Error Message"]
            }), 400
            
        # Check if the expected data is present
        if "Time Series (Daily)" not in data:
            return jsonify({
                "error": "No data available for this ticker",
                "message": "Unexpected response format from API"
            }), 404
            
        # Return the stock data
        return jsonify({
            "status": "success",
            "ticker": ticker.upper(),
            "data": data["Time Series (Daily)"]
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "Failed to fetch stock data",
            "message": str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/')
def home():
    return jsonify({
        "message": "Welcome to the Stock Data API",
        "usage": "Use /api/stock/<TICKER> to get stock data",
        "example": "/api/stock/AAPL"
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)