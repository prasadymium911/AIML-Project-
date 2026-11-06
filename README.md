# 🎓 Student Academic Risk Predictor

A complete machine learning web application with a **FastAPI** backend and a responsive **HTML / CSS / JavaScript** frontend. The application predicts whether a student may need academic support based on academic, behavioral, and demographic factors.

---

## 📁 Project Structure

```
AIML project/
├── StudentPerformanceFactors.csv       # Dataset (6,607 records)
├── notebook.ipynb                      # EDA, training, tuning & export notebook
├── student_risk_logreg_model.joblib    # Trained scikit-learn pipeline (preprocessing + model)
├── README.md                           # Documentation & run instructions
│
├── backend/
│   ├── app.py                          # FastAPI application (endpoints, validation, model serving)
│   ├── main.py                         # FastAPI runner entrypoint
│   └── requirements.txt                # Python dependencies
│
└── frontend/
    ├── index.html                      # Semantic UI with categorized inputs
    ├── css/
    │   └── style.css                   # Custom responsive styling & design tokens
    └── js/
        └── app.js                      # Form bindings, live slider feedback & fetch API calls
```

---

## 🚀 Quick Start

### 1. Create a Python Virtual Environment

```bash
cd "AIML project"
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 3. Run the Backend

```bash
uvicorn backend.main:app --reload --port 8000
```

or run directly:

```bash
python backend/app.py
```

### 4. Open in Browser

- **Web Application UI:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔌 API Endpoints

### `GET /api/health`
Checks whether the server is running and the model is loaded in memory.

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

### `POST /api/predict`
Calculates student risk using all 17 features.

**Sample Request:**
```json
{
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
  "Learning_Disabilities": "No"
}
```

**Sample Response:**
```json
{
  "prediction": 0,
  "probability": 0.1842,
  "label": "OK",
  "risk_level": "Low Risk"
}
```

---

## 🧠 Machine Learning Model Details

- **Model Type:** Tuned Logistic Regression within a full scikit-learn `Pipeline`.
- **Pre-processing:** Handled automatically inside the loaded `.joblib` file:
  - Median imputation + `StandardScaler` for numeric features
  - Most frequent imputation + `OrdinalEncoder` for ordinal attributes
  - Most frequent imputation + `OneHotEncoder` for nominal attributes
- **Target Variable:** `Needs_Support = 1` if `Exam_Score < 65`.

