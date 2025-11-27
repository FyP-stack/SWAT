import React from 'react';

interface ConfusionMatrixProps {
  matrix: number[][];
}

const ConfusionMatrix: React.FC<ConfusionMatrixProps> = ({ matrix }) => {
  if (!matrix || matrix.length === 0) {
    return <div>No confusion matrix data available</div>;
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      maxWidth: '400px',
      margin: '20px auto'
    }}>
      <div style={{ gridColumn: '1 / 2', textAlign: 'center' }}></div>
      <div style={{ fontWeight: 'bold', textAlign: 'center' }}>Predicted Normal</div>
      <div style={{ fontWeight: 'bold', textAlign: 'center' }}>Predicted Attack</div>
      
      <div style={{ fontWeight: 'bold', textAlign: 'center' }}>Actual Normal</div>
      <div style={{ 
        padding: '20px', 
        background: '#e3f2fd', 
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}>
        {matrix[0]?.[0] || 0}
        <div style={{ fontSize: '0.8rem', marginTop: '5px', fontWeight: 'normal' }}>
          True Negative
        </div>
      </div>
      <div style={{ 
        padding: '20px', 
        background: '#ffebee', 
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}>
        {matrix[0]?.[1] || 0}
        <div style={{ fontSize: '0.8rem', marginTop: '5px', fontWeight: 'normal' }}>
          False Positive
        </div>
      </div>
      
      <div style={{ fontWeight: 'bold', textAlign: 'center' }}>Actual Attack</div>
      <div style={{ 
        padding: '20px', 
        background: '#fff3e0', 
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}>
        {matrix[1]?.[0] || 0}
        <div style={{ fontSize: '0.8rem', marginTop: '5px', fontWeight: 'normal' }}>
          False Negative
        </div>
      </div>
      <div style={{ 
        padding: '20px', 
        background: '#e8f5e9', 
        borderRadius: '8px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '1.2rem'
      }}>
        {matrix[1]?.[1] || 0}
        <div style={{ fontSize: '0.8rem', marginTop: '5px', fontWeight: 'normal' }}>
          True Positive
        </div>
      </div>
    </div>
  );
};

export default ConfusionMatrix;