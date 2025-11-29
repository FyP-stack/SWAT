import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { fetchModels, Model } from '../../services/api';
import { BarChart3, Cpu, TrendingUp, AlertCircle, Shield, Zap, X, Folder } from 'lucide-react';

const Dashboard = () => {
  const getModelIcon = (modelId: string) => {
    switch (modelId.toLowerCase()) {
      case 'granger_arima_iqr':
        return <BarChart3 size={32} />;
      case 'granger_exp(mv)_esd+zscore_model':
        return <Cpu size={32} />;
      case 'granger_holtw(double exp)(mv)_model':
        return <TrendingUp size={32} />;
      case 'high_sensitivity_granger_esd_model':
        return <AlertCircle size={32} />;
      case 'optimized_granger_holt_winters_model':
        return <Shield size={32} />;
      case 'rolling_quantile':
        return <Zap size={32} />;
      default:
        return <BarChart3 size={32} />;
    }
  };
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchModels();
      setModels(data.models || []);
    } catch (err) {
      setError('Failed to load models. Make sure the backend is running on http://localhost:8000');
      console.error('Error loading models:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModelClick = (modelId: string) => {
    navigate(`/model/${modelId}`);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading models...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
      <div className="error-container">
          <div className="error-icon"><AlertCircle size={64} /></div>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadModels} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Anomaly Detection Models</h1>
        <p className="subtitle">Select a model to upload data and evaluate performance</p>
        <div className="stats">
          <span className="stat-badge">
            {models.length} {models.length === 1 ? 'Model' : 'Models'} Available
          </span>
        </div>
      </div>

      <div className="models-grid">
        {models.map((model) => (
          <div
            key={model.id}
            className={`model-card ${model.error ? 'error-card' : ''}`}
            onClick={() => !model.error && handleModelClick(model.id)}
          >
            <div className="model-card-header">
              <div className="model-icon">
                {model.error ? <X size={32} /> : getModelIcon(model.id)}
              </div>
              {model.model_type && !model.error && (
                <span className="model-type-badge">{model.model_type}</span>
              )}
            </div>
            
            <h3 className="model-name">{model.name}</h3>
            
            {model.description && !model.error && (
              <p className="model-description">{model.description}</p>
            )}
            
            {model.error && (
              <div className="error-message">
                <small>{model.error}</small>
              </div>
            )}
            
            {!model.error && (
              <div className="card-footer">
                <button className="evaluate-button">
                  Evaluate Model →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {models.length === 0 && (
        <div className="no-models">
          <div className="empty-icon"><Folder size={64} /></div>
          <h2>No Models Found</h2>
          <p>No .pkl model files found in the backend/models directory.</p>
          <p>Please add model files to get started.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
