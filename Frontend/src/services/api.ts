const API_BASE_URL = 'http://localhost:8000';

export interface Model {
  id: string;
  name: string;
  description?: string;
  model_type?: string;
  file_path?: string;
  file_size?: number;
  num_forecast_models?: number;
  anomaly_threshold?: number;
  error?: string;
  type?: string;
}

export interface EvaluationResult {
  model_id?: string;
  model_name: string;
  model_type?: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion_matrix: number[][];
  total_samples?: number;
  anomalies_detected?: number;
  threshold_used?: number;
  n_rows?: number;
  error?: string;
  class_labels?: string[];
  curves?: {
    roc_curve?: { 
      fpr: number[]; 
      tpr: number[]; 
      thresholds: number[]; 
    };
    pr_curve?: { 
      precision: number[]; 
      recall: number[]; 
      thresholds: number[]; 
    };
  };
  raw_score_summary?: {
    min: number;
    max: number;
    mean: number;
    std: number;
    n_unique_scores: number;
  };
}

export interface BatchEvaluationResult {
  results: EvaluationResult[];
  total_models?: number;
  evaluated_models?: number;
}

// Fetch all models with detailed information
export const fetchModels = async (): Promise<{ models: Model[]; count: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/models/detailed`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
};

// Evaluate a single model
export const evaluateModel = async (
  modelId: string,
  file: File,
  labelColumn: string = 'Normal/Attack',
  positiveLabel: string = 'Attack'
): Promise<EvaluationResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model_name', modelId);
    formData.append('label_column', labelColumn);
    formData.append('positive_label', positiveLabel);

    const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Evaluation failed');
    }

    return response.json();
  } catch (error) {
    console.error('Error evaluating model:', error);
    throw error;
  }
};

// Batch evaluate all models
export const batchEvaluate = async (
  file: File,
  labelColumn: string = 'Normal/Attack',
  positiveLabel: string = 'Attack'
): Promise<BatchEvaluationResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('label_column', labelColumn);
    formData.append('positive_label', positiveLabel);

    const response = await fetch(`${API_BASE_URL}/api/compare-models`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Batch evaluation failed');
    }

    return response.json();
  } catch (error) {
    console.error('Error in batch evaluation:', error);
    throw error;
  }
};

// Save evaluation result to database
export const saveEvaluation = async (
  token: string,
  evaluation: EvaluationResult,
  fileName: string,
  notes?: string
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('model_name', evaluation.model_name);
    formData.append('model_type', evaluation.model_type || '');
    formData.append('accuracy', evaluation.accuracy.toString());
    formData.append('precision', evaluation.precision.toString());
    formData.append('recall', evaluation.recall.toString());
    formData.append('f1_score', evaluation.f1.toString());
    formData.append('threshold_used', (evaluation.threshold_used || 0).toString());
    formData.append('confusion_matrix', JSON.stringify(evaluation.confusion_matrix));
    formData.append('class_labels', JSON.stringify(evaluation.class_labels || []));
    formData.append('curves_data', JSON.stringify(evaluation.curves || {}));
    formData.append('n_samples', (evaluation.n_rows || evaluation.total_samples || 0).toString());
    formData.append('n_anomalies', (evaluation.anomalies_detected || 0).toString());
    formData.append('file_name', fileName);
    formData.append('raw_score_summary', JSON.stringify(evaluation.raw_score_summary || {}));
    formData.append('evaluation_notes', notes || '');

    const response = await fetch(`${API_BASE_URL}/api/save-evaluation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save evaluation');
    }

    return response.json();
  } catch (error) {
    console.error('Error saving evaluation:', error);
    throw error;
  }
};

// Create apiService object for backward compatibility
export const apiService = {
  fetchModels,
  evaluateModel: async (
    file: File,
    modelName: string,
    labelColumn: string = 'Normal/Attack',
    positiveLabel: string = 'Attack'
  ): Promise<EvaluationResult> => {
    return evaluateModel(modelName, file, labelColumn, positiveLabel);
  },
  batchEvaluate,
  saveEvaluation,
};

// Authentication functions
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },

  signup: async (email: string, password: string, fullName?: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    return response.json();
  },

  logout: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Logout failed');
    }
  },

  me: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token invalid');
    }

    return response.json();
  },
};

// Also export as default
export default apiService;
