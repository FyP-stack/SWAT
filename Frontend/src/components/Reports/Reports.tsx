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

  const stats = {
    '24h': { alerts: 12, anomalies: 8, models: 5 },
    '7d': { alerts: 87, anomalies: 52, models: 5 },
    '30d': { alerts: 342, anomalies: 198, models: 5 },
  };

  const currentStats = stats[period];

  return (
    <div className="reports-container">
      <div className="reports-breadcrumb"><Link to="/">Dashboard</Link> / Reports</div>
      <h1 className="reports-title">Reports</h1>

      <div className="rep-row">
        <div className="rep-card">
          <div className="rep-title">Time Period</div>
          <select value={period} onChange={e => setPeriod(e.target.value as any)} className="rep-select">
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>

        <div className="rep-card">
          <div className="rep-title">Total Alerts</div>
          <div className="rep-stat">{currentStats.alerts}</div>
          <div className="rep-subtitle">detected in period</div>
        </div>

        <div className="rep-card">
          <div className="rep-title">Anomalies</div>
          <div className="rep-stat">{currentStats.anomalies}</div>
          <div className="rep-subtitle">confirmed cases</div>
        </div>

        <div className="rep-card">
          <div className="rep-title">Active Models</div>
          <div className="rep-stat">{currentStats.models}</div>
          <div className="rep-subtitle">monitoring</div>
        </div>
      </div>

      <div className="rep-actions">
        <button className="rep-btn rep-btn-primary" onClick={onExport}>📥 Download Summary</button>
        <button className="rep-btn rep-btn-secondary">📊 Generate Full Report</button>
      </div>

      <div className="rep-details">
        <h2 className="rep-details-title">Summary Statistics</h2>
        <div className="rep-table-wrap">
          <table className="rep-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>24h</th>
                <th>7d</th>
                <th>30d</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Alerts</td>
                <td>12</td>
                <td>87</td>
                <td>342</td>
              </tr>
              <tr>
                <td>Confirmed Anomalies</td>
                <td>8</td>
                <td>52</td>
                <td>198</td>
              </tr>
              <tr>
                <td>False Positives</td>
                <td>4</td>
                <td>35</td>
                <td>144</td>
              </tr>
              <tr>
                <td>Avg Response Time</td>
                <td>2.3 min</td>
                <td>2.1 min</td>
                <td>2.5 min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}