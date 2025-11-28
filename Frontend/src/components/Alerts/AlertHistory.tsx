import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./AlertHistory.css";

type AlertRow = {
  id: string;
  timestamp: string;
  model: string;
  sensor?: string;
  severity: 'low'|'medium'|'high';
  message: string;
};

const demo: AlertRow[] = [
  { id: 'A-1001', timestamp: '2025-11-15 15:11', model: 'ARIMA', sensor: 'LIT301', severity: 'high', message: 'Structural break detected' },
  { id: 'A-1002', timestamp: '2025-11-15 15:13', model: 'Holt Winters', sensor: 'DPIT301', severity: 'medium', message: 'Causal violation spike' },
  { id: 'A-1003', timestamp: '2025-11-15 14:45', model: 'Granger', sensor: 'FIT201', severity: 'low', message: 'Minor deviation detected' },
  { id: 'A-1004', timestamp: '2025-11-15 14:30', model: 'ESD Z-Score', sensor: 'AIT202', severity: 'high', message: 'pH level anomaly' },
];

export default function AlertHistory() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    return demo.filter(r => r.id.includes(q) || r.model.toLowerCase().includes(q.toLowerCase()) || (r.sensor||'').toLowerCase().includes(q.toLowerCase()));
  }, [q]);

  return (
    <div className="alert-history-container">
      <div className="alert-history-breadcrumb"><Link to="/">Dashboard</Link> / Alert History</div>
      <h1 className="alert-history-title">Alerts</h1>

      <div className="ah-controls">
        <input placeholder="Search by ID, model, sensor" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="ah-table-wrap">
        <table className="ah-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Model</th>
              <th>Sensor</th>
              <th>Severity</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.timestamp}</td>
                <td>{r.model}</td>
                <td>{r.sensor || '-'}</td>
                <td><span className={`sev ${r.severity}`}>{r.severity}</span></td>
                <td>{r.message}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="muted">No alerts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}