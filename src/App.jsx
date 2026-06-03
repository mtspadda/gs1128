import { useState } from "react";
import { parseGroups } from "./utils/barcode";
import BarcodeCard from "./components/BarcodeCard";
import "./styles/app.css";

export default function App() {
  const [input, setInput] = useState(
    "123456789012\nABC-PRODUTO-01\nLOTE-2024-XYZ"
  );
  const [groups, setGroups] = useState([]);
  const [generated, setGenerated] = useState(false);

  function generate() {
    const g = parseGroups(input);
    setGroups(g);
    setGenerated(true);
  }

  function handleKey(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generate();
  }

  const hint = parseGroups(input).length;

  return (
    <div className="app">
      <div className="header">
        <div className="header-badge">GS1-128</div>
        <div>
          <h1>Barcode<br /><span>Generator</span></h1>
          <p>
            One group each line (or split with <code>;</code> ou <code>|</code>)<br />
            Generates one code per input.
          </p>
        </div>
      </div>

      <div className="input-panel">
        <div className="panel-label">Input</div>
        <textarea
          value={input}
          onChange={e => { setInput(e.target.value); setGenerated(false); }}
          onKeyDown={handleKey}
          placeholder={"Exemplo:\n(01)07613304003499\n(10)LOT-2024-A\nABC-PRODUTO-XYZ"}
          spellCheck={false}
        />
        <div className="sep">
          Use: new line / comma <code>;</code> / pipe <code>|</code>
        </div>
        <div className="input-footer">
          <span className="hint">
            {hint > 0
              ? <><strong>{hint}</strong> {hint === 1 ? "No group" : "detected groups"}</>
              : "No detected group"}
          </span>
          <button className="btn-gen" onClick={generate}>
            Generate ↵
          </button>
        </div>
      </div>

      {generated && groups.length > 0 && (
        <>
          <div className="count-bar">
            <h2>Generated codes</h2>
            <span className="count-tag">
              {groups.length} {groups.length === 1 ? "code" : "codes"}
            </span>
          </div>
          <div className="grid">
            {groups.map((g, i) => (
              <BarcodeCard key={i} value={g} index={i} />
            ))}
          </div>
        </>
      )}

      {generated && groups.length === 0 && (
        <div className="empty">
          <span className="big">〄</span>
          No input. Input something (la ele)
        </div>
      )}

      {!generated && (
        <div className="empty">
          <span className="big">▦</span>
          Press <strong>Generate</strong> or press Ctrl+Enter
        </div>
      )}
    </div>
  );
}