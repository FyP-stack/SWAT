import React from "react";
import ConfusionMatrix from "./ConfusionMatrix";
import Curves from "./Curves";
import "./Results.css";

const demoResult = {
  accuracy: 0.993,
  precision: 0.91,
  recall: 0.87,
  f1: 0.89,
  confusion_matrix: [[930, 2], [8, 60]],
  class_labels: ["Normal", "Attack"],
  pr_curve: { precision: [1, 0.93, 0.91, 0.90], recall: [0, 0.4, 0.7, 1] },
  roc_curve: { fpr: [0, 0.2, 0.7, 1], tpr: [0, 0.6, 0.8, 1] },
  anomalies: [
    { timestamp: "2025-11-14 11:41", value: 2.09, label: "Attack" },
    { timestamp: "2025-11-13 08:13", value: 1.41, label: "Attack" },
  ],
};

export default function Results() {
  const result = demoResult;

  return (
    <div className="results-root">
      <h2 className="results-heading">Model Evaluation Results</h2>

      <div className="results-metrics-row">
        <div className="results-metric-card">
          <span className="metric-label">Accuracy</span>
          <b className="metric-value">{result.accuracy?.toFixed(3)}</b>
        </div>
        <div className="results-metric-card">
          <span className="metric-label">Precision</span>
          <b className="metric-value">{result.precision?.toFixed(3)}</b>
        </div>
        <div className="results-metric-card">
          <span className="metric-label">Recall</span>
          <b className="metric-value">{result.recall?.toFixed(3)}</b>
        </div>
        <div className="results-metric-card">
          <span className="metric-label">F1 Score</span>
          <b className="metric-value">{result.f1?.toFixed(3)}</b>
        </div>
      </div>

      <div className="results-visual-row">
        <ConfusionMatrix
          matrix={result.confusion_matrix}
          classLabels={result.class_labels}
        />
        <Curves pr={result.pr_curve} roc={result.roc_curve} />
      </div>

      <div className="results-anomaly-section">
        <h3 className="anomaly-heading">Detected Anomalies</h3>
        <div className="anomaly-list">
          {(result.anomalies || []).length > 0 ? (
            (result.anomalies || []).map((anom, idx) => (
              <div key={idx} className="anomaly-item">
                <div className="anomaly-info">
                  <div className="anomaly-timestamp">
                    <span className="timestamp-label">Timestamp:</span>
                    <span className="timestamp-value">{anom.timestamp}</span>
                  </div>
                  <div className="anomaly-value">
                    <span className="value-label">Score:</span>
                    <span className="value-number">{anom.value.toFixed(2)}</span>
                  </div>
                </div>
                <div className={`anomaly-badge ${anom.label.toLowerCase()}`}>
                  {anom.label}
                </div>
              </div>
            ))
          ) : (
            <p className="no-anomalies">No anomalies detected</p>
          )}
        </div>
      </div>
    </div>
  );
}
