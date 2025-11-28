import React from 'react';
import './MetricsBar.css';

type MetricType = {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  [key: string]: any;
};

const format = (num?: number) => (num !== undefined ? num.toFixed(3) : '--');

const MetricsBar: React.FC<{ metrics: MetricType }> = ({ metrics }) => (
  <div className="metricsbar-root">
    <div className="metrics-card">
      <span>Accuracy</span>
      <b>{format(metrics.accuracy)}</b>
    </div>
    <div className="metrics-card">
      <span>Precision</span>
      <b>{format(metrics.precision)}</b>
    </div>
    <div className="metrics-card">
      <span>Recall</span>
      <b>{format(metrics.recall)}</b>
    </div>
    <div className="metrics-card">
      <span>F1 Score</span>
      <b>{format(metrics.f1)}</b>
    </div>
  </div>
);

export default MetricsBar;