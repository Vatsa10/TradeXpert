# #df = pd.read_csv('Historical Data/daily_NVDA.csv', date_parser=True)

# import numpy as np
# import pandas as pd
# from sklearn.preprocessing import MinMaxScaler
# from tensorflow.keras.models import Sequential
# from tensorflow.keras.layers import LSTM, Dense, Dropout
# from tensorflow.keras.optimizers import Adam
# from sklearn.metrics import mean_absolute_error, mean_squared_error
# from tensorflow.keras.regularizers import l2
# from math import sqrt

# # Load your dataset
# data = pd.read_csv('Historical Data/daily_NVDA.csv')  # Replace with your dataset path

# # Preprocess the data
# data['Timestamp'] = pd.to_datetime(data['Timestamp'], format='%d-%m-%Y')
# data = data.set_index('Timestamp')
# data = data[['Close']]  # Use closing price for prediction

# # Normalize the dataset using MinMaxScaler
# scaler = MinMaxScaler(feature_range=(0, 1))
# scaled_data = scaler.fit_transform(data)

# # Function to prepare data for LSTM model
# def prepare_data(data, time_step):
#     X, y = [], []
#     for i in range(len(data) - time_step):
#         X.append(data[i:i+time_step, 0])
#         y.append(data[i+time_step, 0])
#     return np.array(X), np.array(y)

# # Prepare the data with a time_step of 60 (or any suitable value)
# time_step = 60
# X, y = prepare_data(scaled_data, time_step)

# # Reshape the data for LSTM (samples, time_steps, features)
# X = X.reshape(X.shape[0], X.shape[1], 1)

# # Split the data into training and test sets
# train_size = int(len(X) * 0.8)
# X_train, X_test = X[:train_size], X[train_size:]
# y_train, y_test = y[:train_size], y[train_size:]

# # Build the LSTM model with more units, dropout, and L2 regularization
# model = Sequential()

# model.add(LSTM(units=100, return_sequences=True, input_shape=(X_train.shape[1], 1), kernel_regularizer=l2(0.01)))
# model.add(Dropout(0.2))  # Adding Dropout for regularization

# model.add(LSTM(units=100, return_sequences=False, kernel_regularizer=l2(0.01)))
# model.add(Dropout(0.2))  # Adding Dropout for regularization

# model.add(Dense(units=1))  # Output layer

# # Compile the model with Adam optimizer and a custom learning rate
# optimizer = Adam(learning_rate=0.001)  # You can adjust the learning rate if needed
# model.compile(optimizer=optimizer, loss='mean_squared_error')

# # Train the model
# model.fit(X_train, y_train, epochs=20, batch_size=32, validation_data=(X_test, y_test))

# # Make predictions on the test set
# predictions = model.predict(X_test)

# # Inverse transform predictions and true values to get actual values
# predictions = scaler.inverse_transform(predictions)
# y_test_actual = scaler.inverse_transform(y_test.reshape(-1, 1))

# # Evaluate the model using additional metrics
# mae = mean_absolute_error(y_test_actual, predictions)
# rmse = sqrt(mean_squared_error(y_test_actual, predictions))
# mape = np.mean(np.abs((y_test_actual - predictions) / y_test_actual)) * 100
# accuracy = 100 - mape  # Accuracy as 100% - MAPE
# #accuracy = np.mean(np.abs((y_test_actual - predictions) / y_test_actual)) * 100  # Percentage error

# # Print the evaluation results
# print(f'Mean Absolute Error (MAE): {mae}')
# print(f'Root Mean Squared Error (RMSE): {rmse}')
# print(f'Accuracy: {accuracy}%')

# # Evaluate the model on the test data
# test_loss = model.evaluate(X_test, y_test)
# print(f'Test Loss: {test_loss}')

# # Save the model
# #model.save('lstm_model.h5') # Save the model to a file                  


# # Load the model
# # from tensorflow.keras.models import load_model    
# # loaded_model = load_model('lstm_model.h5')
# # loaded_model.evaluate(X_test, y_test)         
# # Make predictions on the test set  
# # loaded_predictions = loaded_model.predict(X_test) 
# # loaded_predictions = scaler.inverse_transform(loaded_predictions)
# # loaded_y_test_actual = scaler.inverse_transform(y_test.reshape(-1, 1))
# # loaded_mae = mean_absolute_error(loaded_y_test_actual, loaded_predictions)
# # loaded_rmse = sqrt(mean_squared_error(loaded_y_test_actual, loaded_predictions))
# # loaded_accuracy = np.mean(np.abs((loaded_y_test_actual - loaded_predictions) / loaded_y_test_actual)) * 100  # Percentage error
# # loaded_test_loss = loaded_model.evaluate(X_test, y_test)
# # print(f'Loaded Model - Mean Absolute Error (MAE): {loaded_mae}')
# # print(f'Loaded Model - Root Mean Squared Error (RMSE): {loaded_rmse}')
# # print(f'Loaded Model - Accuracy: {loaded_accuracy}%')
# # print(f'Loaded Model - Test Loss: {loaded_test_loss}')
# # Plotting the results
