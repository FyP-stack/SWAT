import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import './Curves.css';

type PR = { precision: number[]; recall: number[] };
type ROC = { fpr: number[]; tpr: number[] };

const toPairs = (x: number[], y: number[], xKey: string, yKey: string) =>
  x.map((xi, i) => ({
    [xKey]: xi,
    [yKey]: y[i] ?? null,
  }));

const CustomTooltip = (props: any) => {
  const { active, payload } = props;

  if (active && payload && payload.length) {
    const value = payload[0].value;

    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{payload[0].dataKey}</p>
        <p className="tooltip-value">{(value as number).toFixed(3)}</p>
      </div>
    );
  }

  return null;
};

const Curves: React.FC<{ pr?: PR | null; roc?: ROC | null }> = ({ pr, roc }) => {
  const prData = pr ? toPairs(pr.recall, pr.precision, 'recall', 'precision') : [];
  const rocData = roc ? toPairs(roc.fpr, roc.tpr, 'fpr', 'tpr') : [];

  return (
    <div className="curves-container">
      <h3 className="curves-title">Model Performance Curves</h3>

      <div className="curves-grid">
        {/* PR Curve */}
        {pr && prData.length > 0 && (
          <div className="curve-card">
            <div className="curve-card-header">
              <h4 className="curve-card-title">Precision-Recall Curve</h4>
              <p className="curve-card-description">Relationship between precision and recall</p>
            </div>
            <div className="curve-chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={prData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(160, 174, 192, 0.2)"
                    vertical={true}
                  />
                  <XAxis
                    dataKey="recall"
                    domain={[0, 1]}
                    type="number"
                    stroke="#b0b0b0"
                    style={{ fontSize: '12px' }}
                    label={{
                      value: 'Recall',
                      position: 'insideBottom',
                      offset: -10,
                      fill: '#f0f0f0',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    stroke="#b0b0b0"
                    style={{ fontSize: '12px' }}
                    label={{
                      value: 'Precision',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#f0f0f0',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 20, color: '#f0f0f0' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="precision"
                    stroke="#00d4ff"
                    dot={{ r: 4, fill: '#00d4ff', strokeWidth: 1, stroke: '#f0f0f0' }}
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    activeDot={{ r: 6 }}
                    name="Precision"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="curve-stats">
              <div className="stat-item">
                <span className="stat-label">Data Points:</span>
                <span className="stat-value">{prData.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max Precision:</span>
                <span className="stat-value">{Math.max(...pr.precision).toFixed(3)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Min Recall:</span>
                <span className="stat-value">{Math.min(...pr.recall).toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ROC Curve */}
        {roc && rocData.length > 0 && (
          <div className="curve-card">
            <div className="curve-card-header">
              <h4 className="curve-card-title">ROC Curve</h4>
              <p className="curve-card-description">Trade-off between True Positive Rate and False Positive Rate</p>
            </div>
            <div className="curve-chart-wrapper">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={rocData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(160, 174, 192, 0.2)"
                    vertical={true}
                  />
                  <XAxis
                    dataKey="fpr"
                    domain={[0, 1]}
                    type="number"
                    stroke="#b0b0b0"
                    style={{ fontSize: '12px' }}
                    label={{
                      value: 'False Positive Rate (FPR)',
                      position: 'insideBottom',
                      offset: -10,
                      fill: '#f0f0f0',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    stroke="#b0b0b0"
                    style={{ fontSize: '12px' }}
                    label={{
                      value: 'True Positive Rate (TPR)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#f0f0f0',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: 20, color: '#f0f0f0' }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="tpr"
                    stroke="#ef4444"
                    dot={{ r: 4, fill: '#ef4444', strokeWidth: 1, stroke: '#f0f0f0' }}
                    strokeWidth={2.5}
                    isAnimationActive={true}
                    activeDot={{ r: 6 }}
                    name="ROC Curve"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="curve-stats">
              <div className="stat-item">
                <span className="stat-label">Data Points:</span>
                <span className="stat-value">{rocData.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max TPR:</span>
                <span className="stat-value">{Math.max(...roc.tpr).toFixed(3)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max FPR:</span>
                <span className="stat-value">{Math.max(...roc.fpr).toFixed(3)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {(!pr || prData.length === 0) && (!roc || rocData.length === 0) && (
        <div className="curves-empty">
          <p className="empty-text">No curve data available</p>
        </div>
      )}
    </div>
  );
};

export default Curves;
