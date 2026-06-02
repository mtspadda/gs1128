import './App.css'
import { useState, useRef, useEffect } from "react";

// ─── GS1-128 / Code 128 encoder ───────────────────────────────────────────────
const CODE128_B = {
  " ":0,"!":1,'"':2,"#":3,"$":4,"%":5,"&":6,"'":7,"(":8,")":9,"*":10,"+":11,
  ",":12,"-":13,".":14,"/":15,"0":16,"1":17,"2":18,"3":19,"4":20,"5":21,"6":22,
  "7":23,"8":24,"9":25,":":26,";":27,"<":28,"=":29,">":30,"?":31,"@":32,"A":33,
  "B":34,"C":35,"D":36,"E":37,"F":38,"G":39,"H":40,"I":41,"J":42,"K":43,"L":44,
  "M":45,"N":46,"O":47,"P":48,"Q":49,"R":50,"S":51,"T":52,"U":53,"V":54,"W":55,
  "X":56,"Y":57,"Z":58,"[":59,"\\":60,"]":61,"^":62,"_":63,"`":64,"a":65,"b":66,
  "c":67,"d":68,"e":69,"f":70,"g":71,"h":72,"i":73,"j":74,"k":75,"l":76,"m":77,
  "n":78,"o":79,"p":80,"q":81,"r":82,"s":83,"t":84,"u":85,"v":86,"w":87,"x":88,
  "y":89,"z":90,"{":91,"|":92,"}":93,"~":94
};

const PATTERNS = [
  "11011001100","11001101100","11001100110","10010011000","10010001100",
  "10001001100","10011001000","10011000100","10001100100","11001001000",
  "11001000100","11000100100","10110011100","10011011100","10011001110",
  "10111001100","10011101100","10011100110","11001110010","11001011100",
  "11001001110","11011100100","11001110100","11101101110","11101001100",
  "11100101100","11100100110","11101100100","11100110100","11100110010",
  "11011011000","11011000110","11000110110","10100011000","10001011000",
  "10001000110","10110001000","10001101000","10001100010","11010001000",
  "11000101000","11000100010","10110111000","10110001110","10001101110",
  "10111011000","10111000110","10001110110","11101110110","11010001110",
  "11000101110","11011101000","11011100010","11011101110","11101011000",
  "11101000110","11100010110","11101101000","11101100010","11100011010",
  "11101111010","11001000010","11110001010","10100110000","10100001100",
  "10010110000","10010000110","10000101100","10000100110","10110010000",
  "10110000100","10011010000","10011000010","10000110100","10000110010",
  "11000010010","11001010000","11110111010","11000010100","10001111010",
  "10100111100","10010111100","10010011110","10111100100","10011110100",
  "10011110010","11110100100","11110010100","11110010010","11011011110",
  "11011110110","11110110110","10101111000","10100011110","10001011110",
  "10111101000","10111100010","11110101000","11110100010","10111011110",
  "10111101110","11101011110","11110101110","11010000100","11010010000",
  "11010011100","1100011101011"
];

// indices for special codes
const START_B = 104;
const STOP    = 106;

function encodeCode128(text) {
  const values = [START_B];
  for (const ch of text) {
    const v = CODE128_B[ch];
    if (v === undefined) throw new Error(`Character '${ch}' not in Code 128B`);
    values.push(v);
  }
  // checksum
  let sum = START_B;
  for (let i = 1; i < values.length; i++) sum += values[i] * i;
  values.push(sum % 103);
  values.push(STOP);

  return values.map(v => PATTERNS[v]).join("") + "11"; // trailing quiet
}

function drawBarcode(canvas, text, label) {
  const ctx = canvas.getContext("2d");
  const barWidth = 2;
  const height   = 80;
  const padX     = 16;
  const padTop   = 10;
  const padBot   = 28;

  let encoded;
  try { encoded = encodeCode128(text); }
  catch { return false; }

  const totalBars = encoded.length;
  canvas.width  = totalBars * barWidth + padX * 2;
  canvas.height = height + padTop + padBot;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x = padX;
  for (const bit of encoded) {
    ctx.fillStyle = bit === "1" ? "#000" : "#fff";
    ctx.fillRect(x, padTop, barWidth, height);
    x += barWidth;
  }

  // label
  ctx.fillStyle = "#000";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, canvas.width / 2, canvas.height - 8);
  return true;
}

// ─── parse groups from textarea ───────────────────────────────────────────────
function parseGroups(text) {
  // split by newline, semicolons, or pipes — filter empty
  return text
    .split(/[\n;|]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ─── BarcodeCard ──────────────────────────────────────────────────────────────
function BarcodeCard({ value, index }) {
  const canvasRef = useRef(null);
  const [error, setError]   = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ok = drawBarcode(canvasRef.current, value, value);
    if (!ok) setError("Caractere inválido para Code 128B");
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
          <button className="btn-action" onClick={download} title="Baixar PNG">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PNG
          </button>
          <button className="btn-action" onClick={copyImg} title="Copiar imagem">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [input,  setInput]  = useState("123456789012\nABC-PRODUTO-01\nLOTE-2024-XYZ");
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:     #ffffff;
          --panel:  #d4d4d4;
          --border: #2a2a2a;
          --accent: #4759ff;
          --accent2: #5a35ff;
          --text:   #585858;
          --muted:  #666;
          --card:   #d4d4d4;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
        }

        .app {
          max-width: 960px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }

        /* header */
        .header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 48px;
        }
        .header-badge {
          background: var(--accent);
          color: #ffffff;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          padding: 4px 8px;
          letter-spacing: .12em;
          text-transform: uppercase;
          margin-top: 6px;
          flex-shrink: 0;
        }
        .header h1 {
          font-size: clamp(28px, 5vw, 48px);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -.02em;
          color: var(--border);
        }
        .header h1 span { color: var(--accent); }
        .header p {
          margin-top: 10px;
          color: var(--border);
          font-size: 14px;
          font-family: 'Space Mono', monospace;
          line-height: 1.6;
        }

        /* input panel */
        .input-panel {
          background: var(--panel);
          border: 1px solid var(--border);
          padding: 24px;
          margin-bottom: 32px;
          position: relative;
        }
        .input-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 4px; height: 100%;
          background: var(--accent);
        }

        .panel-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
        }

        textarea {
          width: 100%;
          background: #ffffff;
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          line-height: 1.8;
          padding: 14px 16px;
          resize: vertical;
          min-height: 130px;
          outline: none;
          transition: border-color .2s;
        }
        textarea:focus { border-color: var(--border); }
        textarea::placeholder { color: #000000; }

        .input-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hint {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--muted);
        }
        .hint strong { color: var(--accent); }

        .btn-gen {
          background: var(--accent);
          color: #000;
          border: none;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: .06em;
          padding: 11px 28px;
          cursor: pointer;
          transition: transform .15s, background .15s;
          text-transform: uppercase;
        }
        .btn-gen:hover { background: #70aeff; transform: translateY(-1px); }
        .btn-gen:active { transform: translateY(0); }

        .sep {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--muted);
          margin-top: 10px;
        }

        /* grid */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        /* card */
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          animation: fadeUp .4s both;
          position: relative;
          overflow: hidden;
        }
        .card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          height: 2px; width: 0;
          background: var(--accent);
          transition: width .3s;
        }
        .card:hover::after { width: 100%; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .card-index {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--accent);
          letter-spacing: .1em;
          align-self: flex-start;
        }

        .barcode-canvas {
          display: block;
          max-width: 100%;
          image-rendering: pixelated;
        }

        .card-value {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--muted);
          word-break: break-all;
          text-align: center;
        }

        .card-error {
          color: var(--accent2);
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          padding: 12px;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }
        .btn-action {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--muted);
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          padding: 6px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: border-color .15s, color .15s;
        }
        .btn-action:hover { border-color: var(--accent); color: var(--accent); }

        /* empty state */
        .empty {
          text-align: center;
          padding: 60px 0;
          color: var(--muted);
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          border: 1px dashed var(--border);
        }
        .empty .big { font-size: 40px; display: block; margin-bottom: 12px; }

        /* count bar */
        .count-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .count-bar h2 {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -.01em;
        }
        .count-tag {
          background: var(--accent);
          color: #ffffff;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
        }
      `}</style>

      <div className="app">
        <div className="header">
          <div>
            <h1>Barcode<br/><span>generator</span></h1>
            <p>
              Split by line (or using <code>;</code> or <code>|</code>)<br/>
            </p>
          </div>
        </div>

        <div className="input-panel">
          <div className="panel-label">Input</div>
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); setGenerated(false); }}
            onKeyDown={handleKey}
            placeholder={"(01)07613304003499\n(10)LOT-2024-A\nABC-PRODUTO-XYZ"}
            spellCheck={false}
          />
          <div className="sep">
            Accepted spliters: new line / comma <code>;</code> / pipe <code>|</code>
          </div>
          <div className="input-footer">
            <span className="hint">
              {hint > 0
                ? <><strong>{hint}</strong> {hint === 1 ? "detected input" : "inputs"}</>
                : "No input"}
            </span>
            <button className="btn-gen" onClick={generate}>
              Generate ↵
            </button>
          </div>
        </div>

        {generated && groups.length > 0 && (
          <>
            <div className="count-bar">
              <h2>generated codes</h2>
              <span className="count-tag">{groups.length} {groups.length === 1 ? "code" : "codes"}</span>
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
            Press <strong>Generate</strong> or use Ctrl+Enter
          </div>
        )}
      </div>
    </>
  );
}