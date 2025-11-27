import React from "react";
import ConfusionMatrix from "./ConfusionMatrix";
import Curves from "./Curves";
import "./Results.css";

const API_URL = "http://127.0.0.1:8000/api";
const demoResult = {
  accuracy: 0.993,
  precision: 0.91,
  recall: 0.87,
  f1: 0.89,
  confusion_matrix: [[930,2],[8,60]],
  class_labels: ["Normal","Attack"],
  pr_curve: { precision: [1,0.93,0.91,0.90], recall: [0,0.4,0.7,1] },
  roc_curve: { fpr: [0,0.2,0.7,1], tpr: [0,0.6,0.8,1] },
  anomalies: [
    { timestamp: "2025-11-14 11:41", value: 2.09, label: "Attack" },
    { timestamp: "2025-11-13 08:13", value: 1.41, label: "Attack" }
  ]
};

export default function Results() {
  // In production, grab :model param and fetch evaluation results accordingly
  const result = demoResult;
  return (
    <div className="results-root">
      <h2 style={{marginBottom:24}}>Model Results</h2>
      <div className="results-metrics-row">
        <div className="results-metric-card"><span>Accuracy</span><b>{result.accuracy?.toFixed(3)}</b></div>
        <div className="results-metric-card"><span>Precision</span><b>{result.precision?.toFixed(3)}</b></div>
        <div className="results-metric-card"><span>Recall</span><b>{result.recall?.toFixed(3)}</b></div>
        <div className="results-metric-card"><span>F1 Score</span><b>{result.f1?.toFixed(3)}</b></div>
      </div>
      <div className="results-visual-row">
        <ConfusionMatrix matrix={result.confusion_matrix} classLabels={result.class_labels} />
        <Curves pr={result.pr_curve} roc={result.roc_curve} />
      </div>
      <div className="results-anomaly-list">
        <h3>Detected Anomalies</h3>
        <ul>
          {(result.anomalies || []).map((anom, idx) => (
            <li key={idx}>
              Timestamp: {anom.timestamp}, Value: {anom.value}, Label: {anom.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}