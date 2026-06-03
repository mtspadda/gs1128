import { useRef, useEffect, useState } from "react";
import { drawBarcode } from "../utils/barcode";

export default function BarcodeCard({ value, index }) {
  const canvasRef = useRef(null);
  const [error, setError]   = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ok = drawBarcode(canvasRef.current, value, value);
    if (!ok) setError("Invalid character Code 128B");
  }, [value]);

  function download() {
    const a = document.createElement("a");
    a.href     = canvasRef.current.toDataURL("image/png");
    a.download = `barcode_${index + 1}_${value.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    a.click();
  }

  function copyImg() {
    canvasRef.current.toBlob(blob => {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="card" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="card-index">#{String(index + 1).padStart(2, "0")}</div>
      {error
        ? <div className="card-error">⚠ {error}</div>
        : <canvas ref={canvasRef} className="barcode-canvas" />
      }
      <div className="card-value">{value}</div>
      {!error && (
        <div className="card-actions">
          <button className="btn-action" onClick={download} title="Dowload PNG">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PNG
          </button>
          <button className="btn-action" onClick={copyImg} title="Copy image">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}