/* ========================================================
   Student Academic Risk Predictor — Frontend Logic
   ======================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("predictionForm");
    const submitBtn = document.getElementById("submitBtn");
    const btnText = document.getElementById("btnText");
    const btnSpinner = document.getElementById("btnSpinner");
    const resultCard = document.getElementById("resultCard");
    const errorCard = document.getElementById("errorCard");
    const errorText = document.getElementById("errorText");

    // ── 1. Numerical Sliders Configuration ──
    const sliders = [
        "Hours_Studied",
        "Attendance",
        "Sleep_Hours",
        "Previous_Scores",
        "Tutoring_Sessions",
        "Physical_Activity",
    ];

    sliders.forEach((id) => {
        const slider = document.getElementById(id);
        const display = document.getElementById(`${id}_val`);
        if (slider && display) {
            slider.addEventListener("input", (e) => {
                display.textContent = e.target.value;
            });
        }
    });

    // ── 2. Toggle Buttons (Binary Attributes) ──
    const toggleGroups = document.querySelectorAll(".toggle-group");
    toggleGroups.forEach((group) => {
        const buttons = group.querySelectorAll(".toggle-btn");
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                buttons.forEach((b) => b.classList.remove("selected"));
                btn.classList.add("selected");
            });
        });
    });

    // ── 3. Preset Profiles Definition ──
    const PRESETS = {
        atRisk: {
            Hours_Studied: 10,
            Attendance: 65,
            Sleep_Hours: 5,
            Previous_Scores: 55,
            Tutoring_Sessions: 0,
            Physical_Activity: 1,
            Parental_Involvement: "Low",
            Family_Income: "Low",
            Parental_Education_Level: "High School",
            Motivation_Level: "Low",
            Distance_from_Home: "Far",
            Teacher_Quality: "Low",
            Peer_Influence: "Negative",
            Access_to_Resources: "Low",
            Learning_Disabilities: "Yes",
            School_Type: "Public",
            Internet_Access: "No",
            Extracurricular_Activities: "No",
        },
        average: {
            Hours_Studied: 20,
            Attendance: 80,
            Sleep_Hours: 7,
            Previous_Scores: 75,
            Tutoring_Sessions: 1,
            Physical_Activity: 3,
            Parental_Involvement: "Medium",
            Family_Income: "Medium",
            Parental_Education_Level: "College",
            Motivation_Level: "Medium",
            Distance_from_Home: "Moderate",
            Teacher_Quality: "Medium",
            Peer_Influence: "Neutral",
            Access_to_Resources: "Medium",
            Learning_Disabilities: "No",
            School_Type: "Public",
            Internet_Access: "Yes",
            Extracurricular_Activities: "Yes",
        },
        highAchiever: {
            Hours_Studied: 35,
            Attendance: 96,
            Sleep_Hours: 8,
            Previous_Scores: 92,
            Tutoring_Sessions: 2,
            Physical_Activity: 4,
            Parental_Involvement: "High",
            Family_Income: "High",
            Parental_Education_Level: "Postgraduate",
            Motivation_Level: "High",
            Distance_from_Home: "Near",
            Teacher_Quality: "High",
            Peer_Influence: "Positive",
            Access_to_Resources: "High",
            Learning_Disabilities: "No",
            School_Type: "Private",
            Internet_Access: "Yes",
            Extracurricular_Activities: "Yes",
        },
    };

    function applyPreset(preset) {
        // Set sliders
        sliders.forEach((id) => {
            const slider = document.getElementById(id);
            const display = document.getElementById(`${id}_val`);
            if (slider && preset[id] !== undefined) {
                slider.value = preset[id];
                if (display) display.textContent = preset[id];
            }
        });

        // Set dropdowns
        const dropdowns = [
            "Parental_Involvement",
            "Family_Income",
            "Parental_Education_Level",
            "Motivation_Level",
            "Distance_from_Home",
            "Teacher_Quality",
            "Peer_Influence",
            "Access_to_Resources",
        ];

        dropdowns.forEach((id) => {
            const el = document.getElementById(id);
            if (el && preset[id] !== undefined) {
                el.value = preset[id];
            }
        });

        // Set toggle buttons
        toggleGroups.forEach((group) => {
            const field = group.getAttribute("data-field");
            if (field && preset[field] !== undefined) {
                const buttons = group.querySelectorAll(".toggle-btn");
                buttons.forEach((btn) => {
                    if (btn.getAttribute("data-value") === preset[field]) {
                        btn.classList.add("selected");
                    } else {
                        btn.classList.remove("selected");
                    }
                });
            }
        });

        // Hide old results on preset change
        resultCard.classList.add("hidden");
        errorCard.classList.add("hidden");
    }

    // Attach preset button handlers
    const btnAtRisk = document.getElementById("btnAtRisk");
    const btnAverage = document.getElementById("btnAverage");
    const btnHighAchiever = document.getElementById("btnHighAchiever");
    const btnReset = document.getElementById("btnReset");

    if (btnAtRisk) btnAtRisk.addEventListener("click", () => applyPreset(PRESETS.atRisk));
    if (btnAverage) btnAverage.addEventListener("click", () => applyPreset(PRESETS.average));
    if (btnHighAchiever) btnHighAchiever.addEventListener("click", () => applyPreset(PRESETS.highAchiever));
    if (btnReset) btnReset.addEventListener("click", () => applyPreset(PRESETS.average));

    // ── 4. Helper: Collect Form Data ──
    function getFormData() {
        const data = {};

        // Numeric fields from sliders
        sliders.forEach((id) => {
            const el = document.getElementById(id);
            data[id] = parseInt(el.value, 10);
        });

        // Dropdown fields
        const dropdowns = [
            "Parental_Involvement",
            "Family_Income",
            "Parental_Education_Level",
            "Motivation_Level",
            "Distance_from_Home",
            "Teacher_Quality",
            "Peer_Influence",
            "Access_to_Resources",
        ];

        dropdowns.forEach((id) => {
            const el = document.getElementById(id);
            data[id] = el.value;
        });

        // Toggle button fields
        toggleGroups.forEach((group) => {
            const field = group.getAttribute("data-field");
            const selectedBtn = group.querySelector(".toggle-btn.selected");
            if (field && selectedBtn) {
                data[field] = selectedBtn.getAttribute("data-value");
            }
        });

        return data;
    }

    // ── 5. Form Submit Handler ──
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Reset display
        resultCard.classList.add("hidden");
        errorCard.classList.add("hidden");

        // Loading state
        submitBtn.disabled = true;
        btnText.textContent = "Analyzing Risk Profile...";
        btnSpinner.classList.remove("hidden");

        const payload = getFormData();

        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                // If FastAPI returned validation details (422), format them nicely
                if (data.detail && Array.isArray(data.detail)) {
                    const messages = data.detail.map((err) => `${err.loc.join(".")}: ${err.msg}`).join("; ");
                    throw new Error(`Validation Error: ${messages}`);
                }
                throw new Error(data.detail || data.error || `Server error (${response.status})`);
            }

            renderResult(data);
        } catch (err) {
            console.error("Prediction error:", err);
            errorText.textContent = err.message || "Failed to connect to the backend server.";
            errorCard.classList.remove("hidden");
            errorCard.scrollIntoView({ behavior: "smooth" });
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = "Predict Risk";
            btnSpinner.classList.add("hidden");
        }
    });

    // ── 6. Render Result & Progress Gauge ──
    function renderResult(data) {
        const { prediction, probability, label, risk_level } = data;

        const circle = document.getElementById("resultCircle");
        const icon = document.getElementById("resultIcon");
        const resLabel = document.getElementById("resultLabel");
        const resRisk = document.getElementById("resultRisk");
        const resProba = document.getElementById("resultProba");
        const resRiskLevel = document.getElementById("resultRiskLevel");
        const riskBarFill = document.getElementById("riskBarFill");

        // Reset styling classes
        circle.className = "result-circle";
        resLabel.className = "result-label";
        if (riskBarFill) riskBarFill.className = "risk-bar-fill";

        const probaPct = (probability * 100).toFixed(1) + "%";

        if (prediction === 1 || risk_level === "High Risk") {
            circle.classList.add("high");
            resLabel.classList.add("high");
            if (riskBarFill) riskBarFill.classList.add("high");
            icon.textContent = "⚠️";
            resLabel.textContent = "Academic Support Needed";
            resRisk.textContent = "This student shows multiple indicators correlated with falling behind.";
        } else if (risk_level === "Medium Risk") {
            circle.classList.add("medium");
            resLabel.classList.add("medium");
            if (riskBarFill) riskBarFill.classList.add("medium");
            icon.textContent = "⚡";
            resLabel.textContent = "Moderate Academic Risk";
            resRisk.textContent = "This student may benefit from proactive monitoring and early intervention.";
        } else {
            circle.classList.add("ok");
            resLabel.classList.add("ok");
            if (riskBarFill) riskBarFill.classList.add("ok");
            icon.textContent = "✅";
            resLabel.textContent = "On Track (Low Risk)";
            resRisk.textContent = "This student is performing satisfactorily with a low risk of falling behind.";
        }

        resProba.textContent = probaPct;
        resRiskLevel.textContent = risk_level;

        if (riskBarFill) {
            // Animate width
            riskBarFill.style.width = "0%";
            setTimeout(() => {
                riskBarFill.style.width = Math.min(Math.max(probability * 100, 4), 100) + "%";
            }, 50);
        }

        resultCard.classList.remove("hidden");
        resultCard.scrollIntoView({ behavior: "smooth" });
    }
});
