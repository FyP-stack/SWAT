import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiService, EvaluationResult } from "../../services/api";
import ConfusionMatrix from "../ConfusionMatrix";
import Curves from "../Curves";
import WaterFileUpload from "./WaterFileUpload";
import "./ModelDetail.css";

const MODEL_META: Record<string, { name: string; icon: string }> = {
  "granger_arima_iqr": { name: "ARIMA", icon: "📈" },
  "granger_exp(Mv)_esd+zscore_model": { name: "Exponential Smoothing", icon: "🌠" },
  "granger_holtW(double Exp)(Mv)_model": { name: "Double Exp", icon: "➗" },
  "optimized_granger_holt_winters_model": { name: "Holt Winters", icon: "❄️" },
  "high_sensitivity_granger_esd_model": { name: "High Sensitivity ESD", icon: "🎯" },
  "fast_granger_esd_model": { name: "Fast Granger ESD", icon: "⚡" },
};

type CSVPreview = {
  headers: string[];
  rows: string[][];
  labelGuess?: string;
  labelCounts?: Record<string, number>;
  columns?: number;
  sampleRows?: number;
};

function parseCSVPreview(file: File, maxRows = 40): Promise<CSVPreview> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = (reader.result as string) || "";
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) return resolve({ headers: [], rows: [] });
        const headers = lines[0].split(",");
        const rows = lines.slice(1, 1 + maxRows).map(l => l.split(","));
        const guess = headers.find(h => /label|attack|normal\/attack/i.test(h));
        const counts: Record<string, number> = {};
        if (guess) {
          const idx = headers.indexOf(guess);
          rows.forEach(r => { const v = r[idx]; counts[v] = (counts[v] || 0) + 1; });
        }
        resolve({ 
          headers, 
          rows, 
          labelGuess: guess, 
          labelCounts: counts, 
          columns: headers.length, 
          sampleRows: rows.length 
        });
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default function ModelDetail() {
  const { modelId = "" } = useParams();
  const meta = useMemo(
    () => MODEL_META[modelId] ?? { name: modelId.replace(/_/g, ' '), icon: "🧪" },
    [modelId]
  );

  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState<"idle" | "upload" | "eval">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [preview, setPreview] = useState<CSVPreview | null>(null);
  const [panelsReady, setPanelsReady] = useState(false);

  useEffect(() => { 
    const t = setTimeout(() => setPanelsReady(true), 30); 
    return () => clearTimeout(t); 
  }, []);

  const handleUpload = async () => {
    if (!file) { 
      setError("Select a file first."); 
      return; 
    }
    setLoading("upload"); 
    setError(""); 
    setPreview(null); 
    setResult(null);
    
    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const p = await parseCSVPreview(file, 40);
        setPreview(p);
      } else {
        setPreview({ headers: [], rows: [], columns: undefined, sampleRows: 0 });
      }
      setUploaded(true);
    } catch { 
      setError("Failed to parse preview."); 
      setUploaded(false); 
    } finally { 
      setLoading("idle"); 
    }
  };

  const handleEvaluate = async () => {
    if (!file) { 
      setError("Select a file first."); 
      return; 
    }
    if (!uploaded) { 
      setError("Click Upload before Evaluate."); 
      return; 
    }
    setLoading("eval"); 
    setError(""); 
    setResult(null);
    
    try {
      const data = await apiService.evaluateModel(file, modelId, "Normal/Attack", "Attack");
      setResult(data);
    } catch (e: any) { 
      setError(e?.message || "Evaluation failed"); 
    } finally { 
      setLoading("idle"); 
    }
  };

  const matrix = result?.confusion_matrix;
  const uploading = loading === "upload";
  const evaluating = loading === "eval";

  const fileMeta = file ? [
    { k: "Name", v: file.name },
    { k: "Type", v: file.type || (file.name.split('.').pop() || '').toUpperCase() },
    { k: "Size", v: `${Math.max(1, Math.round(file.size/1024))} KB` },
    ...(preview?.columns ? [{ k: "Columns", v: String(preview.columns) }] : []),
    ...(preview?.sampleRows ? [{ k: "Sampled Rows", v: String(preview.sampleRows) }] : []),
    ...(preview?.labelGuess ? [{ k: "Label Column", v: preview.labelGuess }] : []),
  ] : [];

  const metrics = result && !result.error ? [
    { label: "Accuracy", value: result.accuracy },
    { label: "Precision", value: result.precision },
    { label: "Recall", value: result.recall },
    { label: "F1 Score", value: result.f1 },
    ...(result.n_rows ? [{ label: "Rows", value: result.n_rows }] : [])
  ] : [];

  return (
    <div className="model-detail-view">
      <main className="dashboard-content">
        <div className="dashboard-breadcrumb">
          <Link to="/dashboard">Dashboard</Link> / <span>{meta.name}</span>
        </div>
        <div className="model-title-row">
          <h1 className="dashboard-title water-gradient">
            <span className="model-icon">{meta.icon}</span>
            {meta.name}
          </h1>
        </div>

        <section className={`panel slide-in ${panelsReady ? "in" : ""}`} style={{ animationDelay: "0ms" }}>
          <h3 className="panel-heading">1) Upload Data</h3>
          <p className="panel-sub">Provide a CSV with a "Normal/Attack" label column for full metrics.</p>

          <WaterFileUpload
            onFile={(f) => { 
              setFile(f); 
              setUploaded(false); 
              setPreview(null); 
              setResult(null); 
              setError(""); 
            }}
            disabled={uploading || evaluating}
            label="Data File"
          />

          {fileMeta.length > 0 && (
            <div className="meta-chips">
              {fileMeta.map(m => (
                <div key={m.k} className="chip">
                  <span>{m.k}</span>
                  <b>{m.v}</b>
                </div>
              ))}
            </div>
          )}

          <div className="action-row">
            <button 
              className="water-btn" 
              disabled={!file || uploading || evaluating} 
              onClick={handleUpload}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button 
              className="water-btn evaluate" 
              disabled={!file || !uploaded || uploading || evaluating} 
              onClick={handleEvaluate}
            >
              {evaluating ? "Evaluating..." : "Evaluate"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="preview-block">
            <h4>Preview</h4>
            {!preview && <div className="panel-note">No preview yet. Upload to preview.</div>}

            {preview && preview.headers.length > 0 && (
              <>
                {preview.labelGuess && preview.labelCounts && (
                  <div className="label-dist">
                    <div className="ld-tag">Detected label: <b>{preview.labelGuess}</b></div>
                    <div className="ld-pills">
                      {Object.entries(preview.labelCounts).map(([k,v]) => (
                        <div key={k} className="pill">{k}: {v}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="preview-table-holder">
                  <table>
                    <thead>
                      <tr>{preview.headers.map((h,i) => <th key={i}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((r,ri) => (
                        <tr key={ri}>{r.map((c,ci) => <td key={ci}>{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {preview && preview.headers.length === 0 && (
              <div className="panel-note">Preview not available client-side for this format. Proceed to Evaluate.</div>
            )}
          </div>
        </section>

        <section className={`panel slide-in ${panelsReady ? "in" : ""}`} style={{ animationDelay: "80ms" }}>
          <h3 className="panel-heading">2) Metrics</h3>
          {!result && <div className="panel-note">Run Evaluate to see performance metrics.</div>}
          {result?.error && <div className="error-banner">{result.error}</div>}
          {metrics.length > 0 && (
            <div className="metrics-grid">
              {metrics.map(m => (
                <div key={m.label} className="metric-card">
                  <span className="metric-label">{m.label}</span>
                  <span className="metric-value">
                    {typeof m.value === 'number' ? m.value.toFixed(3) : String(m.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={`panel slide-in ${panelsReady ? "in" : ""}`} style={{ animationDelay: "160ms" }}>
          <h3 className="panel-heading">3) Confusion Matrix</h3>
          {!matrix && <div className="panel-note">Appears after successful evaluation.</div>}
          {matrix && (
            <div className="matrix-wrapper">
              <ConfusionMatrix 
                matrix={matrix} 
                classLabels={result?.class_labels || ["Normal","Attack"]} 
              />
            </div>
          )}
        </section>

        <section className={`panel slide-in ${panelsReady ? "in" : ""}`} style={{ animationDelay: "240ms" }}>
          <h3 className="panel-heading">4) Curves</h3>
          {!result?.curves && <div className="panel-note">PR & ROC curves appear if backend returns them.</div>}
          {result?.curves && (
            <div className="curves-wrapper">
              <Curves 
                pr={result.curves.pr_curve ?? undefined} 
                roc={result.curves.roc_curve ?? undefined} 
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}