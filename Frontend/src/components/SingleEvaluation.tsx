import React, { useEffect, useState } from 'react';
import './SingleEvaluation.css';

const API_URL = 'http://127.0.0.1:8000/api';

interface EvaluationResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion_matrix: number[][];
  class_labels: string[];
  error?: string;
}

const defaultLabel = "Normal/Attack";
const defaultPositive = "Attack";

// Map backend keys to display names
const modelDisplayNames: Record<string, string> = {
  "granger_arima_iqr":               "ARIMA",
  "granger_exp(Mv)_esd+zscore_model":"Exponential Smoothing",
  "granger_holtW(double Exp)(Mv)_model":"Double Exp",
  "optimized_granger_holt_winters_model":"Holt Winters",
  "high_sensitivity_granger_esd_model":"High Sensitivity ESD",
};

export default function SingleModelEvalCards() {
  const [models, setModels] = useState<string[]>([]);
  const [modelStates, setModelStates] = useState<Record<string, {
    file: File | null;
    label: string;
    positive: string;
    loading: boolean;
    error: string;
    results: EvaluationResult | null;
  }>>({});

  useEffect(() => {
    fetch(`${API_URL}/models`)
      .then(res => res.json())
      .then(data => {
        setModels(data.models);
        setModelStates(ms => {
          const newStates = {...ms};
          for (let m of data.models) {
            if (!newStates[m]) {
              newStates[m] = {
                file: null,
                label: defaultLabel,
                positive: defaultPositive,
                loading: false,
                error: '',
                results: null,
              };
            }
          }
          return newStates;
        });
      });
  }, []);

  function updateModelState(model: string, changes: Partial<typeof modelStates[string]>) {
    setModelStates(s => ({ ...s, [model]: { ...s[model], ...changes } }));
  }

  async function handleEvaluate(model: string) {
    const st = modelStates[model];
    if (!st.file) {
      updateModelState(model, { error: "Please choose a CSV file." });
      return;
    }
    updateModelState(model, { loading: true, error: '', results: null });
    const payload = new FormData();
    payload.append('file', st.file);
    payload.append('label_column', st.label);
    payload.append('positive_label', st.positive);

    try {
      const res = await fetch(`${API_URL}/evaluate/${model}`, { method: "POST", body: payload });
      if (!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      updateModelState(model, { results: data, loading: false });
    } catch (err: any) {
      updateModelState(model, { error: err.message, loading: false });
    }
  }

  return (
    <div className="single-model-eval-root">
      <div className="sme-cards sme-cards-aligned">
        {models.map((model, idx) => {
          const st = modelStates[model] || {};
          const displayName = modelDisplayNames[model] || model;

          return (
            <div key={model} className="sme-card">
              <div className="sme-card-header">
                <h3>{displayName}</h3>
              </div>
              <div className="sme-card-form">
                <label>Test Data (CSV):</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => updateModelState(model, { file: e.target.files?.[0] || null })}
                  style={{marginBottom:8}}
                />
                <label>Label Column:</label>
                <input
                  type="text"
                  value={st.label ?? defaultLabel}
                  onChange={e => updateModelState(model, { label: e.target.value })}
                  placeholder="Normal/Attack"
                  autoComplete="off"
                />
                <label>Positive Label (Attack):</label>
                <input
                  type="text"
                  value={st.positive ?? defaultPositive}
                  onChange={e => updateModelState(model, { positive: e.target.value })}
                  placeholder="Attack"
                  autoComplete="off"
                />
                <button
                  className="sme-eval-btn"
                  disabled={!!st.loading}
                  onClick={() => handleEvaluate(model)}
                  style={{marginTop:12, marginBottom:6}}
                >
                  {st.loading ? "Evaluating..." : "Evaluate"}
                </button>
                {st.error && <div className="sme-error">{st.error}</div>}
              </div>
              {st.results && !st.results.error && (
                <div className="sme-results">
                  <div><b>Accuracy:</b> {st.results.accuracy?.toFixed(3)}</div>
                  <div><b>Precision:</b> {st.results.precision?.toFixed(3)}</div>
                  <div><b>Recall:</b> {st.results.recall?.toFixed(3)}</div>
                  <div><b>F1 Score:</b> {st.results.f1?.toFixed(3)}</div>
                  {/* Add confusion matrix or graphs here if you wish */}
                </div>
              )}
              {st.results?.error && (
                <div className="sme-error">{st.results.error}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}