import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from keras.models import Sequential
from keras.layers import LSTM, Dense

date_mapping = {
    "1day": 1,
    "5days": 5,
    "1month": 30,
    "6months": 180,
    "1year": 365,
    "2years": 730
}

def fetch_data(ticker):
    df = yf.download(ticker, period="1y", interval="1d")
    if df.empty or 'Close' not in df.columns:
        raise ValueError(f"No data found for ticker {ticker}")
    return df[['Close']]

def build_model():
    model = Sequential([
        LSTM(units=50, return_sequences=True, input_shape=(60, 1)),
        LSTM(units=50),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def prepare_data(df):
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(df)
    
    x_train, y_train = [], []
    for i in range(60, len(scaled_data)):
        x_train.append(scaled_data[i-60:i])
        y_train.append(scaled_data[i])
    
    return np.array(x_train), np.array(y_train), scaler, scaled_data

def predict_future(df, duration: str):
    days_to_predict = date_mapping.get(duration.lower())
    if not days_to_predict:
        raise ValueError("Invalid duration")

    x_train, y_train, scaler, scaled_data = prepare_data(df)
    model = build_model()
    model.fit(x_train, y_train, epochs=10, batch_size=32, verbose=0)

    last_60 = scaled_data[-60:]
    predicted_prices = []

    for _ in range(days_to_predict):
        input_seq = last_60[-60:]
        input_seq = input_seq.reshape((1, 60, 1))
        pred = model.predict(input_seq, verbose=0)
        predicted_prices.append(pred[0, 0])
        last_60 = np.append(last_60, pred)[-60:]

    return scaler.inverse_transform(np.array(predicted_prices).reshape(-1, 1)).flatten().tolist()
