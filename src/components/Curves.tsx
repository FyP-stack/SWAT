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
} from 'recharts';

type PR = { precision: number[]; recall: number[] };
type ROC = { fpr: number[]; tpr: number[] };

const toPairs = (x: number[], y: number[], xKey: string, yKey: string) =>
  x.map((xi, i) => ({
    [xKey]: xi,
    [yKey]: y[i] ?? null,
  }));

const Curves: React.FC<{ pr?: PR | null; roc?: ROC | null }> = ({ pr, roc }) => {
  const prData = pr ? toPairs(pr.recall, pr.precision, 'recall', 'precision') : [];
  const rocData = roc ? toPairs(roc.fpr, roc.tpr, 'fpr', 'tpr') : [];

  return (
    <div>
      <h3 style={{ color: '#0e4d61' }}>PR & ROC Curves</h3>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ width: 360, height: 240, background: '#f7fcfe', borderRadius: 12, padding: 8, border: '1px solid #e6ecf1' }}>
          <ResponsiveContainer>
            <LineChart data={prData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recall" domain={[0, 1]} type="number" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="precision" stroke="#19b5dd" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: 360, height: 240, background: '#f7fcfe', borderRadius: 12, padding: 8, border: '1px solid #e6ecf1' }}>
          <ResponsiveContainer>
            <LineChart data={rocData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fpr" domain={[0, 1]} type="number" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tpr" stroke="#16c4bf" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Curves;