from flask import Flask, jsonify, request
import requests
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from datetime import datetime, timedelta

app = Flask(__name__)

API_KEY = "M5LR5HA7I74V9GAE"
BASE_URL = "https://www.alphavantage.co/query"

def prepare_data(data, look_back=60):
    df = pd.DataFrame(data).T
    df.index = pd.to_datetime(df.index)
    df = df.sort_index()
    prices = df['4. close'].astype(float).values
    
    scaler = MinMaxScaler()
    prices_scaled = scaler.fit_transform(prices.reshape(-1, 1))
    
    X, y = [], []
    for i in range(len(prices_scaled) - look_back):
        X.append(prices_scaled[i:i + look_back])
        y.append(prices_scaled[i + look_back])
    
    return np.array(X), np.array(y), scaler

def create_lstm_model(input_shape):
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=input_shape),
        LSTM(50),
        Dense(25),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    return model

def predict_future(model, last_sequence, scaler, periods):
    predictions = []
    current_sequence = last_sequence.copy()
    
    for _ in range(periods):
        pred = model.predict(current_sequence.reshape(1, *current_sequence.shape))
        predictions.append(pred[0, 0])
        current_sequence = np.roll(current_sequence, -1)
        current_sequence[-1] = pred[0, 0]
    
    return scaler.inverse_transform(np.array(predictions).reshape(-1, 1))

@app.route('/api/stock/<ticker>/predict', methods=['GET'])
def get_stock_prediction(ticker):
    try:
        # Get historical data
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": ticker.upper(),
            "outputsize": "full",
            "apikey": API_KEY
        }
        
        response = requests.get(BASE_URL, params=params)
        data = response.json()
        
        if "Time Series (Daily)" not in data:
            return jsonify({"error": "No data available"}), 404

        # Prepare data for LSTM
        X, y, scaler = prepare_data(data["Time Series (Daily)"])
        
        # Train LSTM model
        model = create_lstm_model((X.shape[1], 1))
        model.fit(X, y, epochs=20, batch_size=32, verbose=0)
        
        # Prediction periods (in trading days, approx)
        periods = {
            "1week": 5,
            "1month": 21,
            "2months": 42,
            "3months": 63,
            "6months": 126,
            "9months": 189,
            "1year": 252,
            "2years": 504
        }
        
        # Get last sequence and predict
        last_sequence = scaler.transform(
            pd.DataFrame(data["Time Series (Daily)"]).T['4. close'][-60:].astype(float).values.reshape(-1, 1)
        )
        
        predictions = {}
        for period_name, days in periods.items():
            pred = predict_future(model, last_sequence, scaler, days)
            predictions[period_name] = pred.flatten().tolist()

        # Get current prices for historical graph
        historical_data = {
            date: float(info["4. close"])
            for date, info in sorted(data["Time Series (Daily)"].items())[-252:]  # Last year
        }

        return jsonify({
            "status": "success",
            "ticker": ticker.upper(),
            "historical": historical_data,
            "predictions": predictions
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)