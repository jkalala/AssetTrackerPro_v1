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