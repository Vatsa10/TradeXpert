from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import fetch_data, predict_future

app = FastAPI()

class PredictRequest(BaseModel):
    ticker: str
    duration: str  # e.g., "1day", "1month", etc.

@app.post("/predict")
async def predict_stock_price(request: PredictRequest):
    try:
        df = fetch_data(request.ticker.upper())
        forecast = predict_future(df, request.duration)
        return {
            "ticker": request.ticker.upper(),
            "duration": request.duration,
            "predictions": forecast
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
