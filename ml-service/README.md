# AssetPro ML Service

This is the AI/ML microservice for AssetPro, built with FastAPI. It provides endpoints for predictive maintenance, analytics insights, anomaly detection, semantic search, data enrichment, and forecasting.

## Features (Planned)

- Predictive maintenance
- AI-driven analytics & insights
- Anomaly detection
- Semantic (AI-powered) search
- Automated data enrichment (image/document)
- Predictive analytics for usage/billing

## Development

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run locally

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Run with Docker

```bash
docker build -t assetpro-ml-service .
docker run -p 8000:8000 assetpro-ml-service
```

## Integration

- The main Next.js app will call this service via HTTP (e.g., `http://localhost:8000/predict-maintenance`).
- CORS is enabled for local development.

## Structure

- `main.py`: FastAPI app entry point
- `requirements.txt`: Python dependencies
- `Dockerfile`: Containerization

---

For questions or contributions, see the main AssetPro repo.
