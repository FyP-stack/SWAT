import React, { useState } from 'react';
import './ConfusionMatrix.css';

interface ConfusionMatrixProps {
  matrix: number[][];
  classLabels?: string[];
}

interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  value: number;
  label: string;
}

const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({
  matrix,
  classLabels = ["Normal", "Attack"],
}) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    show: false,
    x: 0,
    y: 0,
    value: 0,
    label: '',
  });

  if (!matrix || matrix.length === 0) {
    return (
      <div className="confusion-matrix-container">
        <div className="confusion-matrix-empty">No confusion matrix data available</div>
      </div>
    );
  }

  // Calculate total for percentages
  const total = matrix.reduce((sum, row) => sum + row.reduce((rowSum, val) => rowSum + val, 0), 0);

  // Calculate percentages
  const getPercentage = (value: number): string => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  const handleCellHover = (e: React.MouseEvent<HTMLDivElement>, value: number, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      value,
      label,
    });
  };

  const handleCellLeave = () => {
    setTooltip({ ...tooltip, show: false });
  };

  return (
    <div className="confusion-matrix-wrapper">
      <h3 className="confusion-matrix-title">Confusion Matrix</h3>
      <div className="confusion-matrix-container">
        <div className="confusion-matrix-grid">
          {/* Headers */}
          <div className="confusion-matrix-header"></div>
          <div className="confusion-matrix-header">
            Predicted {classLabels[0]}
          </div>
          <div className="confusion-matrix-header">
            Predicted {classLabels[1]}
          </div>

          {/* Row 1 */}
          <div className="confusion-matrix-label">Actual {classLabels[0]}</div>
          <div
            className="confusion-matrix-cell tn"
            onMouseEnter={(e) => handleCellHover(e, matrix[0]?.[0] ?? 0, 'True Negative (TN)')}
            onMouseLeave={handleCellLeave}
          >
            <span className="cell-value">{matrix[0]?.[0] ?? 0}</span>
            <span className="cell-percentage">{getPercentage(matrix[0]?.[0] ?? 0)}%</span>
          </div>
          <div
            className="confusion-matrix-cell fp"
            onMouseEnter={(e) => handleCellHover(e, matrix[0]?.[1] ?? 0, 'False Positive (FP)')}
            onMouseLeave={handleCellLeave}
          >
            <span className="cell-value">{matrix[0]?.[1] ?? 0}</span>
            <span className="cell-percentage">{getPercentage(matrix[0]?.[1] ?? 0)}%</span>
          </div>

          {/* Row 2 */}
          <div className="confusion-matrix-label">Actual {classLabels[1]}</div>
          <div
            className="confusion-matrix-cell fn"
            onMouseEnter={(e) => handleCellHover(e, matrix[1]?.[0] ?? 0, 'False Negative (FN)')}
            onMouseLeave={handleCellLeave}
          >
            <span className="cell-value">{matrix[1]?.[0] ?? 0}</span>
            <span className="cell-percentage">{getPercentage(matrix[1]?.[0] ?? 0)}%</span>
          </div>
          <div
            className="confusion-matrix-cell tp"
            onMouseEnter={(e) => handleCellHover(e, matrix[1]?.[1] ?? 0, 'True Positive (TP)')}
            onMouseLeave={handleCellLeave}
          >
            <span className="cell-value">{matrix[1]?.[1] ?? 0}</span>
            <span className="cell-percentage">{getPercentage(matrix[1]?.[1] ?? 0)}%</span>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.show && (
          <div
            className="confusion-matrix-tooltip"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="tooltip-label">{tooltip.label}</div>
            <div className="tooltip-value">Count: {tooltip.value}</div>
            <div className="tooltip-percentage">Percentage: {getPercentage(tooltip.value)}%</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="confusion-matrix-legend">
        <div className="legend-item">
          <span className="legend-color tn-color"></span>
          <span>True Negative (TN)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color tp-color"></span>
          <span>True Positive (TP)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color fp-color"></span>
          <span>False Positive (FP)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color fn-color"></span>
          <span>False Negative (FN)</span>
        </div>
      </div>
    </div>
  );
};

export default ConfusionMatrix;
