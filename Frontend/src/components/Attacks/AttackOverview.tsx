import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ATTACKS, CLASSIFICATIONS, STAGES, AttackRecord } from '../../data/attacks';
import './AttackOverview.css';

type SortKey = 'attackId' | 'classification' | 'intentMet';

export default function AttackOverview() {
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState<string>('ALL');
  const [intent, setIntent] = useState<string>('ALL');
  const [stage, setStage] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('attackId');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  const filtered = useMemo(() => {
    return ATTACKS.filter(a => {
      if (classification !== 'ALL' && a.classification !== classification) return false;
      if (intent !== 'ALL' && (intent === 'Yes') !== a.intentMet) return false;
      if (stage !== 'ALL') {
        const hasStage = a.stages?.includes(stage);
        if (!hasStage) return false;
      }
      if (search) {
        const blob = [
          a.attackId,
          a.stageSensors.join(' '),
          a.initialState,
          a.attackAction,
          a.expectedImpact,
          a.unexpectedOutcome || '',
          a.classification
        ].join(' ').toLowerCase();
        if (!blob.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [search, classification, intent, stage]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a,b) => {
      let vA: any;
      let vB: any;
      switch (sortKey) {
        case 'attackId':
          vA = a.attackId; vB = b.attackId; break;
        case 'classification':
          vA = a.classification || ''; vB = b.classification || ''; break;
        case 'intentMet':
          vA = a.intentMet ? 1 : 0; vB = b.intentMet ? 1 : 0; break;
      }
      if (vA < vB) return sortDir === 'asc' ? -1 : 1;
      if (vA > vB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const summary = useMemo(() => {
    const total = ATTACKS.length;
    const byClass: Record<string,number> = {};
    const intentYes = ATTACKS.filter(a => a.intentMet).length;
    const intentNo  = total - intentYes;
    ATTACKS.forEach(a => {
      byClass[a.classification || 'Unknown'] = (byClass[a.classification || 'Unknown'] || 0) + 1;
    });
    return { total, byClass, intentYes, intentNo };
  }, []);

  function changeSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDir('asc');
    }
  }

  return (
    <div className="swat-dashboard">
      <aside className="sidebar">
        <h2 className="sidebar-title">SWaT Anomaly Detection</h2>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/sensors">Sensor Overview</Link>
          <Link to="/attacks" className="active">Attacks</Link>
          <Link to="/alerts">Alert History</Link>
          <Link to="/reports">Reports</Link>
        </nav>
        <div className="sidebar-divider"/>
      </aside>

      <main className="dashboard-content">
        <div className="dashboard-breadcrumb"><Link to="/">Dashboard</Link> / Attacks</div>
        <h1 className="dashboard-title">Attack Overview</h1>

        <div className="atk-filters">
          <input
            placeholder="Search (sensor, impact, action...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={classification} onChange={e => setClassification(e.target.value)}>
            <option value="ALL">All Classifications</option>
            {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={intent} onChange={e => setIntent(e.target.value)}>
            <option value="ALL">Intent (Any)</option>
            <option value="Yes">Intent Met: Yes</option>
            <option value="No">Intent Met: No</option>
          </select>
            <select value={stage} onChange={e => setStage(e.target.value)}>
            <option value="ALL">Any Stage</option>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="atk-summary">
          <div className="sum-chip total">Total: {summary.total}</div>
          <div className="sum-chip yes">Intent Met: {summary.intentYes}</div>
          <div className="sum-chip no">Intent Not Met: {summary.intentNo}</div>
          {CLASSIFICATIONS.map(c => (
            <div key={c} className="sum-chip class">{c}: {summary.byClass[c] || 0}</div>
          ))}
        </div>

        <div className="atk-table-wrap">
          <table className="atk-table">
            <thead>
              <tr>
                <th onClick={() => changeSort('attackId')}>Attack # {sortKey==='attackId' ? (sortDir==='asc'?'▲':'▼'):''}</th>
                <th>Sensors / Actuators</th>
                <th>Initial State</th>
                <th>Action</th>
                <th onClick={() => changeSort('classification')}>Classification {sortKey==='classification' ? (sortDir==='asc'?'▲':'▼'):''}</th>
                <th>Expected Impact</th>
                <th>Unexpected Outcome</th>
                <th onClick={() => changeSort('intentMet')}>Intent Met {sortKey==='intentMet' ? (sortDir==='asc'?'▲':'▼'):''}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(a => (
                <tr key={a.attackId} className={a.classification ? a.classification.replace(/\s+/g,'-').toLowerCase() : ''}>
                  <td>{a.attackId}</td>
                  <td>
                    {a.stageSensors.length === 0 && <span className="badge empty">None</span>}
                    {a.stageSensors.map(s => (
                      <span key={s} className="badge sensor">{s}</span>
                    ))}
                  </td>
                  <td className="state-col">{a.initialState}</td>
                  <td className="action-col">{a.attackAction}</td>
                  <td>
                    <span className="badge class-badge">{a.classification}</span>
                    <div className="stages-line">
                      {a.stages?.map(st => <span key={st} className="stage-dot">{st}</span>)}
                    </div>
                  </td>
                  <td className="impact-col">{a.expectedImpact}</td>
                  <td className="unexpected-col">{a.unexpectedOutcome || '—'}</td>
                  <td>
                    <span className={`intent-badge ${a.intentMet ? 'yes':'no'}`}>{a.intentMet ? 'Yes':'No'}</span>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-cell">No attacks match current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="atk-footnote">
          Classification heuristic: derived from unique stages and number of distinct points (sensors/actuators). Refine mappings in data/attacks.ts (STAGE_OVERRIDE).
        </div>
      </main>
    </div>
  );
}