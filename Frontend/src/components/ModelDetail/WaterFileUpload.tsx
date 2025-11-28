import React, { useRef, useState } from "react";

interface Props {
  onFile: (file: File | null) => void;
  disabled?: boolean;
  label?: string;
}

export default function WaterFileUpload({ onFile, disabled, label = "Data File" }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const openPicker = () => { if (!disabled) inputRef.current?.click(); };
  const commit = (f: File | null) => { if (f) { setFileName(f.name); onFile(f); } };

  return (
    <div className="wf-root">
      <div
        className={`wf-drop ${dragging ? "dragging" : ""}`}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => e.key === "Enter" && openPicker()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) commit(e.dataTransfer.files?.[0] || null); }}
      >
        <div className="wf-label">{label}</div>
        <div className="wf-instruction">
          {fileName ? `Selected: ${fileName}` : "Drag & drop or click to choose (.csv / .parquet / .xlsx)"}
        </div>
      </div>
      <input
        ref={inputRef}
        style={{ display: "none" }}
        type="file"
        accept=".csv,.parquet,.xlsx"
        onChange={(e) => commit(e.target.files?.[0] || null)}
        disabled={disabled}
      />
    </div>
  );
}