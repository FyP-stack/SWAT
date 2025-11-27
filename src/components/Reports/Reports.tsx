import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Reports.css";

export default function Reports() {
  const [period, setPeriod] = useState<'24h'|'7d'|'30d'>('24h');

  const onExport = () => {
    const blob = new Blob([`Report period: ${period}\nGenerated: ${new Date().toISOString()}`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `swat-report-${period}.txt`;
    a.click();
  };

  return (
    <div className="swat-dashboard">
      <aside className="sidebar">
        <h2 className="sidebar-title">SWaT Anomaly Detection</h2>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/sensors">Sensor Overview</Link>
          <Link to="/alerts">Alert History</Link>
          <Link to="/reports" className="active">Reports</Link>
        </nav>
        <div className="sidebar-divider"/>
      </aside>

      <main className="dashboard-content">
        <div className="dashboard-breadcrumb"><Link to="/">Dashboard</Link> / Reports</div>
        <h1 className="dashboard-title">Reports</h1>

        <div className="rep-row">
          <div className="rep-card">
            <div className="rep-title">Period</div>
            <select value={period} onChange={e => setPeriod(e.target.value as any)}>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div className="rep-card">
            <div className="rep-title">Export</div>
            <button className="rep-btn" onClick={onExport}>Download Summary</button>
          </div>
        </div>
      </main>
    </div>
  );
}