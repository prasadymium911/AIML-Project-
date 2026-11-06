"""
Student Academic Risk Predictor — FastAPI Backend
Loads the trained scikit-learn pipeline and serves predictions via REST API.
Also mounts and serves the static frontend (HTML/CSS/JS).
"""

import os
from typing import Literal
from contextlib import asynccontextmanager

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Configuration & Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODEL_PATH = os.path.join(PROJECT_ROOT, "student_risk_logreg_model.joblib")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

# Column order expected by the model (matches the original CSV minus Exam_Score & Gender)
FEATURE_COLUMNS = [
    "Hours_Studied",
    "Attendance",
    "Parental_Involvement",
    "Access_to_Resources",
    "Extracurricular_Activities",
    "Sleep_Hours",
    "Previous_Scores",
    "Motivation_Level",
    "Internet_Access",
    "Tutoring_Sessions",
    "Family_Income",
    "Teacher_Quality",
    "School_Type",
    "Peer_Influence",
    "Physical_Activity",
    "Learning_Disabilities",
    "Parental_Education_Level",
    "Distance_from_Home",
]

# ---------------------------------------------------------------------------
# Global Model State & Lifespan
# ---------------------------------------------------------------------------
model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    try:
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        model = None
        print(f"❌ Failed to load model from {MODEL_PATH}: {e}")
    yield


app = FastAPI(
    title="Student Academic Risk Predictor API",
    description="Machine Learning API predicting if a student needs academic support",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic Schema for Input Validation
# ---------------------------------------------------------------------------
class StudentFeatures(BaseModel):
    Hours_Studied: int = Field(..., ge=1, le=44, description="Weekly study hours (1-44)")
    Attendance: int = Field(..., ge=60, le=100, description="Attendance percentage (60-100)")
    Sleep_Hours: int = Field(..., ge=4, le=10, description="Daily sleep hours (4-10)")
    Previous_Scores: int = Field(..., ge=50, le=100, description="Previous exam score (50-100)")
    Tutoring_Sessions: int = Field(..., ge=0, le=8, description="Weekly tutoring sessions (0-8)")
    Physical_Activity: int = Field(..., ge=0, le=6, description="Weekly physical activity hours (0-6)")

    Parental_Involvement: Literal["Low", "Medium", "High"]
    Access_to_Resources: Literal["Low", "Medium", "High"]
    Motivation_Level: Literal["Low", "Medium", "High"]
    Family_Income: Literal["Low", "Medium", "High"]
    Teacher_Quality: Literal["Low", "Medium", "High"]
    Parental_Education_Level: Literal["High School", "College", "Postgraduate"]
    Distance_from_Home: Literal["Near", "Moderate", "Far"]

    Extracurricular_Activities: Literal["Yes", "No"]
    Internet_Access: Literal["Yes", "No"]
    School_Type: Literal["Public", "Private"]
    Peer_Influence: Literal["Positive", "Neutral", "Negative"]
    Learning_Disabilities: Literal["Yes", "No"]

    model_config = {
        "json_schema_extra": {
            "example": {
                "Hours_Studied": 20,
                "Attendance": 80,
                "Sleep_Hours": 7,
                "Previous_Scores": 75,
                "Tutoring_Sessions": 1,
                "Physical_Activity": 3,
                "Parental_Involvement": "Medium",
                "Access_to_Resources": "Medium",
                "Motivation_Level": "Medium",
                "Family_Income": "Medium",
                "Teacher_Quality": "Medium",
                "Parental_Education_Level": "College",
                "Distance_from_Home": "Moderate",
                "Extracurricular_Activities": "Yes",
                "Internet_Access": "Yes",
                "School_Type": "Public",
                "Peer_Influence": "Neutral",
                "Learning_Disabilities": "No",
            }
        }
    }


class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    label: str
    risk_level: str


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def classify_risk(probability: float) -> str:
    """Map probability of needing support to a risk tier."""
    if probability >= 0.7:
        return "High Risk"
    elif probability >= 0.4:
        return "Medium Risk"
    else:
        return "Low Risk"


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["System"])
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
    }


@app.post("/api/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(features: StudentFeatures):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Please ensure student_risk_logreg_model.joblib exists.",
        )

    try:
        # Convert Pydantic model to dict, then DataFrame with exact column order
        data_dict = features.model_dump()
        input_df = pd.DataFrame([[data_dict[col] for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)

        prediction = int(model.predict(input_df)[0])
        proba = float(model.predict_proba(input_df)[0][1])  # P(Needs_Support = 1)

        return PredictionResponse(
            prediction=prediction,
            probability=round(proba, 4),
            label="Needs Support" if prediction == 1 else "OK",
            risk_level=classify_risk(proba),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ---------------------------------------------------------------------------
# Static Frontend Serving
# ---------------------------------------------------------------------------
if os.path.exists(FRONTEND_DIR):
    # Mount css and js subdirectories
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    if os.path.exists(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.exists(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")

    @app.get("/", tags=["Frontend"])
    def serve_index():
        index_file = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Frontend index.html not found"}


# ---------------------------------------------------------------------------
# Direct Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
