import React, { useRef } from 'react';

type Props = {
  onFile: (file: File | null) => void;
};

const FileUploader: React.FC<Props> = ({ onFile }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    let file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      className="dashboard-fileuploader"
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      tabIndex={0}
      title="Drag & drop or click to upload CSV"
    >
      <input
        type="file"
        accept=".csv"
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div>
        <div style={{ fontSize: 16, opacity: 0.8 }}>Upload Test File (CSV)</div>
        <div style={{ color: '#7b82ea', marginTop: 8, fontWeight: 'bold' }}>Drag & drop or click</div>
      </div>
    </div>
  );
};

export default FileUploader;