import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os
from sklearn.ensemble import IsolationForest

MODEL_PATH = "predictive_maintenance_model.joblib"
DATA_PATH = "sample_asset_data.csv"


def load_data():
    df = pd.read_csv(DATA_PATH)
    X = df[["usage_hours", "last_maintenance_days", "failures", "age_years"]]
    y = df["will_fail_soon"]
    return X, y


def train_and_save_model():
    X, y = load_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    joblib.dump(clf, MODEL_PATH)
    return acc


def load_model():
    if not os.path.exists(MODEL_PATH):
        train_and_save_model()
    return joblib.load(MODEL_PATH)

def train_anomaly_model():
    X, _ = load_data()
    model = IsolationForest(contamination=0.2, random_state=42)
    model.fit(X)
    joblib.dump(model, "anomaly_model.joblib")
    return True

def load_anomaly_model():
    if not os.path.exists("anomaly_model.joblib"):
        train_anomaly_model()
    return joblib.load("anomaly_model.joblib")

def detect_anomalies(features_list):
    model = load_anomaly_model()
    preds = model.predict(features_list)
    # -1 = anomaly, 1 = normal
    return preds.tolist()

def optimize_utilization(historical_utilization, location_changes, maintenance_events, operational_hours):
    """Analyze utilization patterns and provide optimization recommendations"""
    import numpy as np
    
    # Calculate current utilization metrics
    current_utilization = np.mean(historical_utilization) if historical_utilization else 0.5
    optimal_utilization = 0.85  # Target utilization rate
    
    # Calculate efficiency score
    efficiency_score = min(current_utilization / optimal_utilization, 1.0)
    
    # Generate recommendations based on patterns
    recommendations = []
    potential_savings = 0
    
    if current_utilization < 0.6:
        recommendations.append({
            "type": "relocate",
            "description": "Consider relocating asset to higher-demand area",
            "expected_improvement": 0.2,
            "implementation_effort": "medium"
        })
        potential_savings += 1500
    
    if location_changes > 5:
        recommendations.append({
            "type": "stabilize_location",
            "description": "Reduce frequent relocations to improve efficiency",
            "expected_improvement": 0.1,
            "implementation_effort": "low"
        })
        potential_savings += 800
    
    if maintenance_events > 3:
        recommendations.append({
            "type": "preventive_maintenance",
            "description": "Implement preventive maintenance to reduce downtime",
            "expected_improvement": 0.15,
            "implementation_effort": "high"
        })
        potential_savings += 2000
    
    return {
        "current_utilization": current_utilization,
        "optimal_utilization": optimal_utilization,
        "efficiency_score": efficiency_score,
        "recommendations": recommendations,
        "potential_savings": potential_savings
    }

def forecast_utilization(historical_data, forecast_periods=12):
    """Simple time series forecasting for utilization"""
    import numpy as np
    
    if len(historical_data) < 3:
        # Not enough data for forecasting
        return [0.5] * forecast_periods
    
    # Simple linear trend forecasting
    x = np.arange(len(historical_data))
    y = np.array(historical_data)
    
    # Calculate trend
    trend = np.polyfit(x, y, 1)[0]
    last_value = historical_data[-1]
    
    # Generate forecast
    forecast = []
    for i in range(1, forecast_periods + 1):
        predicted_value = last_value + (trend * i)
        # Ensure values stay within reasonable bounds
        predicted_value = max(0.1, min(1.0, predicted_value))
        forecast.append(predicted_value)
    
    return forecast

def generate_lifecycle_forecast(historical_data, forecast_months=12):
    """Generate comprehensive lifecycle forecasts"""
    import numpy as np
    from datetime import datetime, timedelta
    
    # Extract utilization data from historical records
    utilization_data = []
    maintenance_costs = []
    
    for record in historical_data:
        if 'utilization' in record:
            utilization_data.append(record['utilization'])
        if 'maintenance_cost' in record:
            maintenance_costs.append(record['maintenance_cost'])
    
    # Generate utilization forecast
    utilization_forecast = forecast_utilization(utilization_data, forecast_months)
    
    # Generate maintenance cost forecast (simplified)
    avg_maintenance_cost = np.mean(maintenance_costs) if maintenance_costs else 500
    maintenance_forecast = []
    
    for i in range(forecast_months):
        # Add some seasonality and trend
        seasonal_factor = 1 + 0.1 * np.sin(2 * np.pi * i / 12)  # Annual cycle
        trend_factor = 1 + 0.02 * i  # 2% monthly increase
        cost = avg_maintenance_cost * seasonal_factor * trend_factor
        maintenance_forecast.append(cost)
    
    # Generate predictions with dates
    predictions = []
    confidence_intervals = []
    current_date = datetime.now()
    
    for i in range(forecast_months):
        future_date = current_date + timedelta(days=30 * (i + 1))
        
        predictions.extend([
            {
                "date": future_date.isoformat(),
                "predicted_value": utilization_forecast[i],
                "metric": "utilization_percentage",
                "unit": "percent"
            },
            {
                "date": future_date.isoformat(),
                "predicted_value": maintenance_forecast[i],
                "metric": "maintenance_cost",
                "unit": "dollars"
            }
        ])
        
        # Add confidence intervals
        confidence_intervals.append({
            "date": future_date.isoformat(),
            "lower_bound": max(0, utilization_forecast[i] - 0.1),
            "upper_bound": min(1, utilization_forecast[i] + 0.1),
            "confidence_level": 0.8
        })
    
    # Trend analysis
    utilization_trend = "increasing" if len(utilization_data) > 1 and utilization_data[-1] > utilization_data[0] else "stable"
    cost_trend = "increasing" if len(maintenance_costs) > 1 and maintenance_costs[-1] > maintenance_costs[0] else "stable"
    
    return {
        "predictions": predictions,
        "confidence_intervals": confidence_intervals,
        "trend_analysis": {
            "utilization_trend": utilization_trend,
            "cost_trend": cost_trend,
            "forecast_reliability": "medium" if len(historical_data) > 6 else "low"
        }
    } 