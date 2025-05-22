// Stock API service for fetching and transforming stock data

const API_KEY = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export const fetchStockData = async (symbol) => {
  try {
    const response = await fetch(
      `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`
    );
    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    if (!data['Time Series (Daily)']) {
      throw new Error('No data available for this symbol');
    }

    return {
      success: true,
      data: data['Time Series (Daily)']
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch stock data'
    };
  }
};

export const transformStockData = (rawData) => {
  return Object.entries(rawData).map(([date, values]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    close: parseFloat(values['4. close']),
    volume: parseFloat(values['5. volume'])
  })).reverse().slice(0, 90); // Last 90 days of data
};