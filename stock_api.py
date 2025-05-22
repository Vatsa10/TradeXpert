from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
from typing import List, Optional

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StockRequest(BaseModel):
    symbol: str
    range: Optional[str] = '1mo'  # e.g. '1d', '5d', '1mo', '6mo', '1y', '2y', '5y', 'max'

@app.get("/api/stock")
def get_stock(symbol: str, range: str = '1mo'):
    try:
        ticker = yf.Ticker(symbol)
        # Info
        info = ticker.info
        # Historical data
        hist = ticker.history(period=range)
        historical_data = [
            {"date": idx.strftime('%Y-%m-%d'), "close": row['Close']} for idx, row in hist.iterrows()
        ]
        if not historical_data:
            raise Exception("No historical data found for this symbol and range.")
        return {
            "symbol": info.get('symbol', symbol),
            "shortName": info.get('shortName', ''),
            "price": info.get('regularMarketPrice', None),
            "change": info.get('regularMarketChange', None),
            "changePercent": info.get('regularMarketChangePercent', None),
            "marketCap": info.get('marketCap', None),
            "volume": info.get('volume', None),
            "pe": info.get('trailingPE', None),
            "eps": info.get('trailingEps', None),
            "historicalData": historical_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
