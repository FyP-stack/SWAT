import React, { useState } from 'react';
import './BatchEvaluation.css';

interface EvaluationResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion_matrix: number[][];
  class_labels: string[];
  n_rows: number;
  error?: string;
}

interface BatchEvaluationResponse {
  models_evaluated: string[];
  results: Record<string, EvaluationResult>;
  best_model: string | null;
  best_f1_score: number;
  total_samples: number;
}

const BatchEvaluation: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BatchEvaluationResponse | null>(null);
  const [error, setError] = useState<string>('');

  const formatMetric = (val?: number) => {
    if (val === undefined || isNaN(val)) return '0.000';
    return val.toFixed(3);
  };

  const getAnomaliesDetected = (result: EvaluationResult): number => {
    if (result.error || !result.confusion_matrix || result.confusion_matrix.length < 2) return 0;
    return (result.confusion_matrix[1]?.[0] || 0) + (result.confusion_matrix[1]?.[1] || 0);
  };

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('file') as File;
    const labelColumn = formData.get('labelColumn') as string;
    const positiveLabel = formData.get('positiveLabel') as string;

    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('label_column', labelColumn);
      payload.append('positive_label', positiveLabel);

      const response = await fetch('http://localhost:8000/api/evaluate-all', {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Evaluation failed');
      }

      const data: BatchEvaluationResponse = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Evaluation failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Evaluating all models... This may take a few minutes.</p>
      </div>
    );
  }

  return (
    <div className="batch-evaluation">
      <h2>Batch Model Evaluation</h2>

      <form onSubmit={handleFileUpload} className="upload-form">
        <div className="form-group">
          <label htmlFor="file">Test Data (CSV):</label>
          <input type="file" id="file" name="file" accept=".csv" required />
        </div>

        <div className="form-group">
          <label htmlFor="labelColumn">Label Column:</label>
          <input type="text" id="labelColumn" name="labelColumn" defaultValue="Normal/Attack" required />
        </div>

        <div className="form-group">
          <label htmlFor="positiveLabel">Positive Label (Attack):</label>
          <input type="text" id="positiveLabel" name="positiveLabel" defaultValue="Attack" required />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Evaluating...' : 'Evaluate All Models'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results-container">

          {results.best_model && (
            <div className="best-model-card">
              <h3>🏆 Best Performing Model</h3>
              <div className="best-model-info">
                <strong>{results.best_model}</strong>
                <span>F1 Score: {formatMetric(results.best_f1_score)}</span>
              </div>
            </div>
          )}

          <div className="metrics-comparison">
            <h3>Model Comparison</h3>

            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>Anomalies Detected</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(results.results).map(([model, result]) => (
                  <tr key={model} className={model === results.best_model ? 'best-model-row' : ''}>
                    <td>
                      <strong>{model}</strong>
                      {model === results.best_model && ' 🏆'}
                    </td>
                    <td>{result.error ? 'Error' : formatMetric(result.accuracy)}</td>
                    <td>{result.error ? 'Error' : formatMetric(result.precision)}</td>
                    <td>{result.error ? 'Error' : formatMetric(result.recall)}</td>
                    <td>{result.error ? 'Error' : formatMetric(result.f1)}</td>
                    <td>{result.error ? 'Error' : getAnomaliesDetected(result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="model-details">
            <h3>Detailed Results</h3>

            <div className="model-cards">
              {Object.entries(results.results).map(([model, result]) => (
                <div key={model} className="model-card">
                  <h4>{model}</h4>

                  {result.error ? (
                    <div className="error">Error: {result.error}</div>
                  ) : (
                    <div className="model-metrics">
                      <div className="metric"><span>Accuracy:</span><span>{formatMetric(result.accuracy)}</span></div>
                      <div className="metric"><span>Precision:</span><span>{formatMetric(result.precision)}</span></div>
                      <div className="metric"><span>Recall:</span><span>{formatMetric(result.recall)}</span></div>
                      <div className="metric"><span>F1-Score:</span><span>{formatMetric(result.f1)}</span></div>
                      <div className="metric"><span>Anomalies:</span><span>{getAnomaliesDetected(result)}</span></div>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default BatchEvaluation;
