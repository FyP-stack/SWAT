import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  Download,
  RefreshCw,
  Zap,
  Filter,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import ConfusionMatrix from "../ConfusionMatrix";
import Curves from "../Curves";
import "./Reports.css";

interface EvaluationReport {
  id: number;
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  n_samples: number;
  file_name: string;
  created_at: string;
}

interface DetailedEvaluation {
  id: number;
  model_name: string;
  model_type?: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  threshold_used?: number;
  confusion_matrix: number[][];
  class_labels?: string[];
  curves_data: {
    roc_curve?: {
      fpr: number[];
      tpr: number[];
      thresholds: number[];
    };
    pr_curve?: {
      precision: number[];
      recall: number[];
      thresholds: number[];
    };
  };
  n_samples: number;
  n_anomalies?: number;
  file_name: string;
  raw_score_summary?: {
    min: number;
    max: number;
    mean: number;
    std: number;
    n_unique_scores: number;
  };
  evaluation_notes?: string;
  created_at: string;
}

interface Stats {
  total_evaluations: number;
  average_f1: number;
  average_accuracy: number;
  best_f1_score: number;
  best_f1_model: string;
  most_used_model: string;
  model_usage_count: Record<string, number>;
}

export default function Reports() {
  const [evaluations, setEvaluations] = useState<EvaluationReport[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState("all");
  const [detailedEvaluation, setDetailedEvaluation] = useState<DetailedEvaluation | null>(null);
  const [showingReport, setShowingReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchEvaluations();
    fetchStats();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const token = localStorage.getItem("swat.token");
      const response = await fetch("http://localhost:8000/api/evaluations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch evaluations");

      const data = await response.json();
      setEvaluations(data.evaluations || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load evaluations");
      console.error("Error fetching evaluations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("swat.token");
      const response = await fetch(
        "http://localhost:8000/api/evaluations/stats/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchEvaluations();
    fetchStats();
  };

  const handleExport = () => {
    if (evaluations.length === 0) return;

    const csv = [
      ["Model", "Accuracy", "Precision", "Recall", "F1 Score", "Samples", "Date"],
      ...evaluations.map((e) => [
        e.model_name,
        (e.accuracy * 100).toFixed(2) + "%",
        (e.precision * 100).toFixed(2) + "%",
        (e.recall * 100).toFixed(2) + "%",
        (e.f1_score * 100).toFixed(2) + "%",
        e.n_samples,
        new Date(e.created_at).toLocaleString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `swat-evaluations-${new Date().getTime()}.csv`;
    a.click();
  };

  const fetchDetailedEvaluation = async (evaluationId: number) => {
    setReportLoading(true);
    try {
      const token = localStorage.getItem("swat.token");
      const response = await fetch(`http://localhost:8000/api/evaluations/${evaluationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch detailed evaluation");

      const data = await response.json();
      setDetailedEvaluation(data);
      setShowingReport(true);
    } catch (err) {
      console.error("Error fetching detailed evaluation:", err);
    } finally {
      setReportLoading(false);
    }
  };

  const viewReport = (evaluationId: number) => {
    fetchDetailedEvaluation(evaluationId);
  };

  const closeReport = () => {
    setShowingReport(false);
    setDetailedEvaluation(null);
  };

  const filteredEvaluations =
    filterModel === "all"
      ? evaluations
      : evaluations.filter((e) => e.model_name === filterModel);

  const uniqueModels = [...new Set(evaluations.map((e) => e.model_name))];

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div>
          <div className="reports-breadcrumb">
            <Link to="/dashboard">Dashboard</Link> / Reports
          </div>
          <h1 className="reports-title">
            <BarChart3 size={32} />
            Evaluation Reports
          </h1>
        </div>
        <div className="reports-actions">
          <button className="btn-icon" onClick={handleRefresh} title="Refresh">
            <RefreshCw size={20} />
          </button>
          <button
            className="btn-icon btn-download"
            onClick={handleExport}
            disabled={evaluations.length === 0}
            title="Export CSV"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-icon-1">
              <Zap size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Evaluations</div>
              <div className="stat-value">{stats.total_evaluations}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-2">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Average F1 Score</div>
              <div className="stat-value">
                {(stats.average_f1 * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-3">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Average Accuracy</div>
              <div className="stat-value">
                {(stats.average_accuracy * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-4">
              <Zap size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Best Model</div>
              <div className="stat-value">
                {stats.best_f1_model?.substring(0, 15)}...
              </div>
              <div className="stat-subtitle">
                {(stats.best_f1_score * 100).toFixed(1)}% F1
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Results Table */}
      <div className="reports-section">
        <div className="section-header">
          <h2>Evaluation History</h2>
          {uniqueModels.length > 0 && (
            <div className="filter-group">
              <Filter size={18} />
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Models</option>
                {uniqueModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading evaluations...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={handleRefresh} className="btn-retry">
              Retry
            </button>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="empty-state">
            <p>No evaluations yet. Start by evaluating a model on the Dashboard.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="evaluations-table">
              <thead>
                <tr>
                  <th>Model Name</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1 Score</th>
                  <th>Samples</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvaluations.map((eval_) => (
                  <tr key={eval_.id} className="table-row">
                    <td className="model-name">{eval_.model_name}</td>
                    <td>
                      <span className="metric-badge accuracy">
                        {(eval_.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className="metric-badge precision">
                        {(eval_.precision * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className="metric-badge recall">
                        {(eval_.recall * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span className="metric-badge f1">
                        {(eval_.f1_score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td>{eval_.n_samples || "N/A"}</td>
                    <td className="date">
                      {new Date(eval_.created_at).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn-icon btn-view"
                        onClick={() => viewReport(eval_.id)}
                        title="View Detailed Report"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Usage Stats */}
      {stats && stats.model_usage_count && Object.keys(stats.model_usage_count).length > 0 && (
        <div className="reports-section">
          <h2>Model Usage Statistics</h2>
          <div className="usage-grid">
            {Object.entries(stats.model_usage_count).map(([model, count]) => (
              <div key={model} className="usage-card">
                <div className="usage-model">{model}</div>
                <div className="usage-count">{count}</div>
                <div className="usage-label">evaluations</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Report Modal/Section */}
      {showingReport && detailedEvaluation && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <div className="report-modal-header">
              <button className="btn-icon btn-close" onClick={closeReport} title="Close Report">
                <ArrowLeft size={20} />
              </button>
              <h2>Detailed Evaluation Report</h2>
            </div>

            {reportLoading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading report details...</p>
              </div>
            ) : (
              <div className="report-content">
                {/* Report Header */}
                <div className="report-header-info">
                  <div className="info-item">
                    <strong>Model:</strong> {detailedEvaluation.model_name}
                  </div>
                  <div className="info-item">
                    <strong>File:</strong> {detailedEvaluation.file_name}
                  </div>
                  <div className="info-item">
                    <strong>Date:</strong> {new Date(detailedEvaluation.created_at).toLocaleString()}
                  </div>
                  {detailedEvaluation.threshold_used && (
                    <div className="info-item">
                      <strong>Threshold:</strong> {detailedEvaluation.threshold_used.toFixed(4)}
                    </div>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="report-metrics-grid">
                  <div className="metric-card">
                    <span className="metric-label">Accuracy</span>
                    <span className="metric-value">{detailedEvaluation.accuracy.toFixed(4)}</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Precision</span>
                    <span className="metric-value">{detailedEvaluation.precision.toFixed(4)}</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">Recall</span>
                    <span className="metric-value">{detailedEvaluation.recall.toFixed(4)}</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-label">F1 Score</span>
                    <span className="metric-value">{detailedEvaluation.f1_score.toFixed(4)}</span>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="report-stats-row">
                  <div className="stat-item">Total Samples: {detailedEvaluation.n_samples}</div>
                  {detailedEvaluation.n_anomalies && (
                    <div className="stat-item">Detected Anomalies: {detailedEvaluation.n_anomalies}</div>
                  )}
                  {detailedEvaluation.raw_score_summary && (
                    <div className="stat-item">
                      Score Range: {detailedEvaluation.raw_score_summary.min?.toFixed(3)} - {detailedEvaluation.raw_score_summary.max?.toFixed(3)}
                    </div>
                  )}
                </div>

                {/* Confusion Matrix */}
                {detailedEvaluation.confusion_matrix && detailedEvaluation.confusion_matrix.length > 0 && (
                  <div className="report-section">
                    <h3>Confusion Matrix</h3>
                    <div className="matrix-wrapper">
                      <ConfusionMatrix
                        matrix={detailedEvaluation.confusion_matrix}
                        classLabels={detailedEvaluation.class_labels || ["Normal", "Attack"]}
                      />
                    </div>
                  </div>
                )}

                {/* Curves */}
                {detailedEvaluation.curves_data && (
                  <div className="report-section">
                    <h3>Performance Curves</h3>
                    <div className="curves-wrapper">
                      <Curves
                        pr={detailedEvaluation.curves_data.pr_curve ? {
                          precision: detailedEvaluation.curves_data.pr_curve.precision,
                          recall: detailedEvaluation.curves_data.pr_curve.recall
                        } : undefined}
                        roc={detailedEvaluation.curves_data.roc_curve ? {
                          fpr: detailedEvaluation.curves_data.roc_curve.fpr,
                          tpr: detailedEvaluation.curves_data.roc_curve.tpr
                        } : undefined}
                      />
                    </div>
                  </div>
                )}

                {/* Raw Score Summary */}
                {detailedEvaluation.raw_score_summary && (
                  <div className="report-section">
                    <h3>Raw Score Statistics</h3>
                    <div className="stats-grid-detailed">
                      <div className="stat-row">
                        <span>Min Score:</span>
                        <span>{detailedEvaluation.raw_score_summary.min?.toFixed(4) || "N/A"}</span>
                      </div>
                      <div className="stat-row">
                        <span>Max Score:</span>
                        <span>{detailedEvaluation.raw_score_summary.max?.toFixed(4) || "N/A"}</span>
                      </div>
                      <div className="stat-row">
                        <span>Mean Score:</span>
                        <span>{detailedEvaluation.raw_score_summary.mean?.toFixed(4) || "N/A"}</span>
                      </div>
                      <div className="stat-row">
                        <span>Std Score:</span>
                        <span>{detailedEvaluation.raw_score_summary.std?.toFixed(4) || "N/A"}</span>
                      </div>
                      <div className="stat-row">
                        <span>Unique Scores:</span>
                        <span>{detailedEvaluation.raw_score_summary.n_unique_scores}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {detailedEvaluation.evaluation_notes && (
                  <div className="report-section">
                    <h3>Evaluation Notes</h3>
                    <p className="evaluation-notes">{detailedEvaluation.evaluation_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
