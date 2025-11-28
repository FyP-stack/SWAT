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
};

// Authentication functions
export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },

  signup: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      body: formData,
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
