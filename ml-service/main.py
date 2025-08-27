from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from model_utils import (
    load_model, train_and_save_model, detect_anomalies, train_anomaly_model,
    forecast_utilization, optimize_utilization, generate_lifecycle_forecast
)

app = FastAPI(title="AssetPro ML Service", version="0.2.0")

# Allow CORS for local development and integration with Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AssetFeatures(BaseModel):
    usage_hours: float
    last_maintenance_days: float
    failures: int
    age_years: float
    temperature_avg: Optional[float] = None
    vibration_avg: Optional[float] = None
    pressure_avg: Optional[float] = None

class AssetFeaturesList(BaseModel):
    features_list: List[List[float]]

class UtilizationData(BaseModel):
    asset_id: str
    historical_utilization: List[float]
    location_changes: int
    maintenance_events: int
    operational_hours: float

class ForecastRequest(BaseModel):
    asset_id: str
    historical_data: List[Dict[str, Any]]
    forecast_months: int = 12

class BatchPredictionRequest(BaseModel):
    assets: List[AssetFeatures]
    prediction_types: List[str]

@app.get("/")
def read_root():
    return {"message": "AssetPro ML Service is running"}

# Placeholder for future ML endpoints
# Example: /predict-maintenance, /insights, /anomaly, /enrich, /forecast 

@app.post("/predict-maintenance")
def predict_maintenance(features: AssetFeatures):
    model = load_model()
    X = [[
        features.usage_hours,
        features.last_maintenance_days,
        features.failures,
        features.age_years
    ]]
    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0][1]
    return {
        "will_fail_soon": bool(prediction),
        "probability": probability
    }

@app.post("/train-maintenance-model")
def train_model():
    acc = train_and_save_model()
    return {"message": "Model trained", "accuracy": acc} 

@app.post("/anomaly-insights")
def anomaly_insights(payload: AssetFeaturesList):
    preds = detect_anomalies(payload.features_list)
    return {"anomalies": preds}

@app.post("/train-anomaly-model")
def train_anomaly():
    train_anomaly_model()
    return {"message": "Anomaly model trained"}

@app.post("/optimize-utilization")
def optimize_utilization_endpoint(data: UtilizationData):
    """Analyze asset utilization and provide optimization recommendations"""
    try:
        optimization = optimize_utilization(
            data.historical_utilization,
            data.location_changes,
            data.maintenance_events,
            data.operational_hours
        )
        return {
            "asset_id": data.asset_id,
            "current_utilization": optimization["current_utilization"],
            "optimal_utilization": optimization["optimal_utilization"],
            "efficiency_score": optimization["efficiency_score"],
            "recommendations": optimization["recommendations"],
            "potential_savings": optimization["potential_savings"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/forecast-lifecycle")
def forecast_lifecycle_endpoint(request: ForecastRequest):
    """Generate lifecycle forecasts for assets"""
    try:
        forecast = generate_lifecycle_forecast(
            request.historical_data,
            request.forecast_months
        )
        return {
            "asset_id": request.asset_id,
            "forecast_type": "lifecycle",
            "time_horizon_months": request.forecast_months,
            "predictions": forecast["predictions"],
            "confidence_intervals": forecast["confidence_intervals"],
            "trend_analysis": forecast["trend_analysis"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-predictions")
def batch_predictions(request: BatchPredictionRequest):
    """Process multiple assets for various prediction types"""
    try:
        results = []
        
        for asset in request.assets:
            asset_results = {}
            
            # Maintenance prediction
            if "maintenance" in request.prediction_types:
                model = load_model()
                X = [[
                    asset.usage_hours,
                    asset.last_maintenance_days,
                    asset.failures,
                    asset.age_years
                ]]
                prediction = model.predict(X)[0]
                probability = model.predict_proba(X)[0][1]
                
                asset_results["maintenance"] = {
                    "will_fail_soon": bool(prediction),
                    "probability": probability,
                    "confidence": calculate_confidence(probability)
                }
            
            # Anomaly detection
            if "anomaly" in request.prediction_types:
                features = [asset.usage_hours, asset.last_maintenance_days, asset.failures, asset.age_years]
                anomaly_result = detect_anomalies([features])
                asset_results["anomaly"] = {
                    "is_anomaly": anomaly_result[0] == -1,
                    "anomaly_score": anomaly_result[0]
                }
            
            results.append(asset_results)
        
        return {
            "total_processed": len(request.assets),
            "results": results,
            "processing_time": "calculated_in_production"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
def get_model_info():
    """Get information about available models"""
    return {
        "models": {
            "predictive_maintenance": {
                "version": "1.0",
                "algorithm": "RandomForest",
                "features": ["usage_hours", "last_maintenance_days", "failures", "age_years"],
                "accuracy": "calculated_during_training"
            },
            "anomaly_detection": {
                "version": "1.0", 
                "algorithm": "IsolationForest",
                "contamination_rate": 0.2
            }
        },
        "service_version": "0.2.0"
    }

def calculate_confidence(probability: float) -> float:
    """Calculate confidence score based on probability"""
    if probability > 0.8 or probability < 0.2:
        return 0.9
    elif probability > 0.6 or probability < 0.4:
        return 0.7
    else:
        return 0.5 