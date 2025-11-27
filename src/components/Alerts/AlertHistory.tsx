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
];

export default function AlertHistory() {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    return demo.filter(r => r.id.includes(q) || r.model.toLowerCase().includes(q.toLowerCase()) || (r.sensor||'').toLowerCase().includes(q.toLowerCase()));
  }, [q]);

  return (
    <div className="swat-dashboard">
      <aside className="sidebar">
        <h2 className="sidebar-title">SWaT Anomaly Detection</h2>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/sensors">Sensor Overview</Link>
          <Link to="/alerts" className="active">Alert History</Link>
          <Link to="/reports">Reports</Link>
        </nav>
        <div className="sidebar-divider"/>
      </aside>

      <main className="dashboard-content">
        <div className="dashboard-breadcrumb"><Link to="/">Dashboard</Link> / Alert History</div>
        <h1 className="dashboard-title">Alerts</h1>

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
      </main>
    </div>
  );
}