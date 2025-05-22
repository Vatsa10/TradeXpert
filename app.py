from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal
import requests
import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
import datetime

app = FastAPI()

# Alpha Vantage settings
API_KEY = "M5LR5HA7I74V9GAE"
BASE_URL = "https://www.alphavantage.co/query"

# Request schema
class PredictRequest(BaseModel):
    ticker: str
    duration: Literal["1day", "5days", "1month", "6months", "1year", "2years"]

# Helper: Map duration to number of months
duration_to_months = {
    "1day": 1,
    "5days": 1,
    "1month": 1,
    "6months": 6,
    "1year": 12,
    "2years": 24
}

# Function to create and train LSTM model
def create_and_train_model(data):
    # LSTM model architecture
    model = Sequential()
    model.add(LSTM(units=50, return_sequences=True, input_shape=(data.shape[1], 1)))
    model.add(LSTM(units=50, return_sequences=False))
    model.add(Dense(units=1))

    model.compile(optimizer='adam', loss='mean_squared_error')

    # Train model
    model.fit(data, data, epochs=5, batch_size=32)
    return model

# Endpoint
@app.post("/predict")
def predict_stock(req: PredictRequest):
    symbol = req.ticker.upper()
    months = duration_to_months[req.duration]

    # Step 1: Get monthly stock data
    params = {
        "function": "TIME_SERIES_MONTHLY",
        "symbol": symbol,
        "apikey": API_KEY
    }

    response = requests.get(BASE_URL, params=params)
    data = response.json()

    if "Monthly Time Series" not in data:
        raise HTTPException(status_code=400, detail="Error fetching data from Alpha Vantage.")

    # Step 2: Extract and preprocess data
    df = pd.DataFrame(data["Monthly Time Series"]).T
    df = df.rename(columns={"4. close": "close"}).astype(float)
    df = df.sort_index()

    close_prices = df["close"].values.reshape(-1, 1)
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(close_prices)

    # Prepare the training data
    X_train = []
    y_train = []
    for i in range(60, len(scaled_data)):
        X_train.append(scaled_data[i-60:i, 0])
        y_train.append(scaled_data[i, 0])

    X_train, y_train = np.array(X_train), np.array(y_train)
    X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)

    # Step 3: Create and train the LSTM model
    model = create_and_train_model(X_train)

    # Step 4: Prepare the last 60 days input for prediction
    X_test = scaled_data[-60:]
    X_test = X_test.reshape((1, X_test.shape[0], 1))

    # Step 5: Predict future prices
    predicted = []
    current_input = X_test[0]

    for _ in range(months):
        next_pred = model.predict(current_input[np.newaxis, :, :], verbose=0)[0][0]
        predicted.append(next_pred)
        current_input = np.append(current_input[1:], [[next_pred]], axis=0)

    predicted_prices = scaler.inverse_transform(np.array(predicted).reshape(-1, 1)).flatten().tolist()

    # Step 6: Return predicted prices with future dates
    last_date = pd.to_datetime(df.index[-1])
    future_dates = [(last_date + pd.DateOffset(months=i+1)).strftime('%Y-%m-%d') for i in range(months)]

    return {
        "ticker": symbol,
        "predictions": dict(zip(future_dates, predicted_prices))
    }
