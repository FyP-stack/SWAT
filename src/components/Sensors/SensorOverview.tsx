import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./SensorOverview.css";
import { sensorsByProcess, SensorDef, PROCESSES } from "../../data/sensors";

export default function SensorOverview() {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("ALL");

  const flat: SensorDef[] = useMemo(() => {
    return PROCESSES.flatMap(p => sensorsByProcess[p] || []);
  }, []);

  const filtered = flat.filter(s =>
    (stage === "ALL" || s.process === stage) &&
    (s.id.toLowerCase().includes(q.toLowerCase()) || s.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="swat-dashboard">
      <aside className="sidebar">
        <h2 className="sidebar-title">SWaT Anomaly Detection</h2>
        <nav>
          <Link to="/" className="">Dashboard</Link>
          <Link to="/sensors" className="active">Sensor Overview</Link>
          <Link to="/alerts" className="">Alert History</Link>
          <Link to="/reports" className="">Reports</Link>
        </nav>
        <div className="sidebar-divider"/>
      </aside>

      <main className="dashboard-content">
        <div className="dashboard-breadcrumb"><Link to="/">Dashboard</Link> / Sensor Overview</div>
        <h1 className="dashboard-title">Plant Sensors</h1>

        <div className="so-controls">
          <input className="so-input" placeholder="Search sensor (e.g., LIT101, flow, valve)" value={q} onChange={e => setQ(e.target.value)} />
          <select className="so-select" value={stage} onChange={e => setStage(e.target.value)}>
            <option value="ALL">All Stages</option>
            {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="sensor-grid">
          {filtered.map(s => (
            <div key={s.id} className="sensor-card">
              <div className="sensor-head">
                <div className={`dot ${s.status ?? 'ok'}`} />
                <div className="sid">{s.id}</div>
                <div className="stag">{s.process}</div>
              </div>
              <div className="sname">{s.name}</div>
              {s.unit && <div className="meta">Unit: <b>{s.unit}</b></div>}
              {s.range && <div className="meta">Range: <b>{s.range}</b></div>}
              {s.desc && <div className="desc">{s.desc}</div>}
            </div>
          ))}
          {filtered.length === 0 && <div className="panel-note">No sensors match your filters.</div>}
        </div>
      </main>
    </div>
  );
}