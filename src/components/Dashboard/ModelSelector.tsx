import React from 'react';

type Props = {
  models: string[];
  value: string;
  onChange: (val: string) => void;
};

const ModelSelector: React.FC<Props> = ({ models, value, onChange }) => (
  <div className="model-selector">
    <label htmlFor="model-select">Algorithm:</label>
    <select
      id="model-select"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="dashboard-input"
    >
      {models.map(m => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  </div>
);

export default ModelSelector;