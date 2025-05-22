import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# Load and preprocess data
def load_data(file_path):
    df = pd.read_csv(file_path)
    df['Timestamp'] = pd.to_datetime(df['Timestamp'], format='%d-%m-%Y')
    df = df.set_index('Timestamp')
    df = df[['Close']]
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(df)
    return df, scaled_data, scaler

# Prepare data for LSTM model
def prepare_data(scaled_data, look_back=60):
    X, y = [], []
    for i in range(look_back, len(scaled_data)):
        X.append(scaled_data[i-look_back:i, 0])
        y.append(scaled_data[i, 0])
    X, y = np.array(X), np.array(y)
    X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    return X, y

# Build LSTM model
def build_model(input_shape):
    model = Sequential([
        LSTM(units=50, return_sequences=True, input_shape=input_shape),
        Dropout(0.2),
        LSTM(units=50, return_sequences=False),
        Dropout(0.2),
        Dense(units=25),
        Dense(units=1)
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

# Predict future stock prices
def predict_future_prices(model, scaled_data, scaler, look_back=60, future_days=180):
    predicted_prices = []
    last_sequence = scaled_data[-look_back:]
    for _ in range(future_days):
        prediction = model.predict(np.reshape(last_sequence, (1, look_back, 1)))
        predicted_prices.append(prediction[0, 0])
        last_sequence = np.append(last_sequence[1:], prediction, axis=0)
    predicted_prices = scaler.inverse_transform(np.array(predicted_prices).reshape(-1, 1))
    return predicted_prices

# Plot results
def plot_results(df, predicted_prices, future_days):
    future_dates = pd.date_range(start=df.index[-1], periods=future_days + 1, freq='D')[1:]
    future_dates = future_dates[::15]  # Select every 15th day
    plt.figure(figsize=(12, 6))
    plt.plot(df.index, df['Close'], label='Historical Prices')
    plt.plot(future_dates, predicted_prices[::15], label='Predicted Prices', linestyle='--')
    plt.title('Stock Price Prediction')
    plt.xlabel('Date')
    plt.ylabel('Price')
    plt.legend()
    plt.show()

if __name__ == "__main__":
    file_path = 'Historical Data/daily_NVDA.csv'
    df, scaled_data, scaler = load_data(file_path)
    look_back = 60
    X, y = prepare_data(scaled_data, look_back)
    model = build_model((X.shape[1], 1))
    model.fit(X, y, epochs=10, batch_size=32)
    future_days = 180
    predicted_prices = predict_future_prices(model, scaled_data, scaler, look_back, future_days)
    plot_results(df, predicted_prices, future_days)
