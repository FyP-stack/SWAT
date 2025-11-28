export interface EvaluationResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion_matrix: number[][];
  class_labels: string[];
  n_rows: number;
  curves?: {
    roc_curve?: {
      fpr: number[];
      tpr: number[];
      auc: number;
      thresholds: number[];
    };
    pr_curve?: {
      precision: number[];
      recall: number[];
      auc: number;
      thresholds: number[];
    };
  };
  error?: string;
}

export interface BatchEvaluationResult {
  models_evaluated: string[];
  results: { [modelName: string]: EvaluationResult };
  best_model: string | null;
  best_f1_score: number;
  total_samples: number;
}

export interface ModelComparison {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  anomaliesDetected: number;
}