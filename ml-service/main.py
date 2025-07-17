from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model_utils import load_model, train_and_save_model, detect_anomalies, train_anomaly_model

app = FastAPI(title="AssetPro ML Service", version="0.1.0")

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

class AssetFeaturesList(BaseModel):
    features_list: list

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