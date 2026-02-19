import { useState, useEffect, useRef } from "react";

// ─── DATA & CONSTANTS ──────────────────────────────────────────────────────────
const STATIONS = [
  "New Delhi", "Mathura Jn", "Agra Cantt", "Gwalior", "Jhansi Jn",
  "Bhopal Jn", "Itarsi Jn", "Nagpur", "Wardha", "Sevagram",
  "Kazipet Jn", "Secunderabad", "Chennai Central"
];

const NAMES = [
  "Arjun Sharma","Priya Patel","Rohan Mehta","Kavya Singh","Amit Kumar",
  "Sneha Rao","Vijay Nair","Deepika Joshi","Rahul Gupta","Ananya Das",
  "Suresh Iyer","Meera Pillai","Kiran Reddy","Pooja Verma","Nikhil Shah",
  "Lakshmi Menon","Aditya Choudhury","Suman Banerjee","Ravi Tiwari","Anita Mishra",
  "Tarun Bajaj","Geeta Malhotra","Sachin Yadav","Rekha Saxena","Mohan Tripathi",
  "Sunita Pandey","Dinesh Srivastava","Usha Krishnan","Naresh Bose","Kamala Swamy",
  "Harish Patil","Savita Kulkarni","Ramesh Desai","Leela Nambiar","Sunil Hegde",
  "Bharathi Gopal","Venkat Raman","Geetha Suresh","Ajay Chauhan","Nandini Roy"
];

const DEST_PAIRS = [
  ["Agra Cantt","Chennai Central"],["Bhopal Jn","Chennai Central"],
  ["New Delhi","Nagpur"],["Gwalior","Secunderabad"],["Mathura Jn","Wardha"],
  ["New Delhi","Chennai Central"],["Jhansi Jn","Kazipet Jn"],["Itarsi Jn","Chennai Central"],
];

const STATUSES = ["occupied","rac","unverified","released"];
const STATUS_WEIGHTS = [0.65, 0.12, 0.10, 0.13];

function weightedRandom(items, weights) {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r < acc) return items[i];
  }
  return items[items.length - 1];
}

function genSeats() {
  return Array.from({ length: 40 }, (_, i) => {
    const pair = DEST_PAIRS[Math.floor(Math.random() * DEST_PAIRS.length)];
    const status = weightedRandom(STATUSES, STATUS_WEIGHTS);
    return {
      id: i + 1,
      seatNo: `S${String(i + 1).padStart(2,"0")}`,
      name: status === "released" ? "—" : NAMES[i % NAMES.length],
      boarding: pair[0],
      destination: pair[1],
      status,
      aiScore: status === "released" ? null : Math.floor(Math.random() * 41) + 60,
      noShowRisk: Math.random() < 0.15,
    };
  });
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  occupied:   { label:"Occupied",   color:"#22c55e", bg:"rgba(34,197,94,0.12)",  border:"rgba(34,197,94,0.35)",  glow:"rgba(34,197,94,0.4)"  },
  rac:        { label:"RAC",        color:"#eab308", bg:"rgba(234,179,8,0.12)",  border:"rgba(234,179,8,0.35)",  glow:"rgba(234,179,8,0.4)"  },
  unverified: { label:"Unverified", color:"#ef4444", bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.35)",  glow:"rgba(239,68,68,0.4)"  },
  released:   { label:"Released",   color:"#3b82f6", bg:"rgba(59,130,246,0.12)", border:"rgba(59,130,246,0.35)", glow:"rgba(59,130,246,0.4)" },
};

const AI_SCORE_COLOR = (s) => s >= 85 ? "#22c55e" : s >= 70 ? "#eab308" : "#ef4444";

// ─── TOAST ────────────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:"rgba(15,23,42,0.95)", border:`1px solid ${t.color}`,
          boxShadow:`0 0 16px ${t.color}60`, borderRadius:12, padding:"10px 16px",
          color:"#e2e8f0", fontSize:13, fontFamily:"'JetBrains Mono',monospace",
          display:"flex", alignItems:"center", gap:8, minWidth:260,
          animation:"slideIn 0.3s ease",
        }}>
          <span style={{ color: t.color, fontSize:16 }}>{t.icon}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── DONUT CHART ──────────────────────────────────────────────────────────────
function DonutChart({ seats }) {
  const occ = seats.filter(s=>s.status==="occupied").length;
  const rac = seats.filter(s=>s.status==="rac").length;
  const unv = seats.filter(s=>s.status==="unverified").length;
  const rel = seats.filter(s=>s.status==="released").length;
  const total = seats.length;

  const segments = [
    { val: occ, color: "#22c55e" },
    { val: rac, color: "#eab308" },
    { val: unv, color: "#ef4444" },
    { val: rel, color: "#3b82f6" },
  ];

  const cx = 60, cy = 60, r = 44, strokeW = 12;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <svg width={120} height={120} style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
        {segments.map((seg, i) => {
          const dashLen = (seg.val / total) * circ;
          const dashOff = -offset;
          offset += dashLen;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={strokeW}
              strokeDasharray={`${dashLen} ${circ - dashLen}`}
              strokeDashoffset={circ / 4 - offset + dashLen}
              style={{ filter:`drop-shadow(0 0 4px ${seg.color})`, transition:"all 0.5s" }}
            />
          );
        })}
        <text x={cx} y={cy-5} textAnchor="middle" fill="#e2e8f0" fontSize={18} fontWeight="bold" fontFamily="monospace">
          {Math.round((occ/total)*100)}%
        </text>
        <text x={cx} y={cy+12} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="monospace">
          OCCUPIED
        </text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {[["occupied","Occupied",occ],["rac","RAC",rac],["unverified","Unverif.",unv],["released","Released",rel]].map(([k,l,v])=>(
          <div key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontFamily:"monospace" }}>
            <div style={{ width:8, height:8, borderRadius:2, background:STATUS_CONFIG[k].color, boxShadow:`0 0 6px ${STATUS_CONFIG[k].color}` }} />
            <span style={{ color:"#94a3b8" }}>{l}</span>
            <span style={{ color:"#e2e8f0", marginLeft:"auto", fontWeight:"bold" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SEAT CARD ────────────────────────────────────────────────────────────────
function SeatCard({ seat, onClick, highlight }) {
  const cfg = STATUS_CONFIG[seat.status];
  const isReleased = seat.status === "released";

  return (
    <div onClick={() => onClick(seat)}
      style={{
        background: cfg.bg,
        border: `1px solid ${highlight ? cfg.color : cfg.border}`,
        borderRadius: 14,
        padding: "10px 10px 8px",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        boxShadow: highlight ? `0 0 18px ${cfg.glow}` : "none",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
        e.currentTarget.style.boxShadow = `0 6px 24px ${cfg.glow}`;
        e.currentTarget.style.borderColor = cfg.color;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = highlight ? `0 0 18px ${cfg.glow}` : "none";
        e.currentTarget.style.borderColor = highlight ? cfg.color : cfg.border;
      }}
    >
      {/* Pulse for released */}
      {isReleased && (
        <div style={{
          position:"absolute", inset:0, borderRadius:14,
          border:`2px solid ${cfg.color}`,
          animation:"pulse-ring 2s infinite",
          opacity:0.5,
          pointerEvents:"none",
        }} />
      )}

      {/* Header row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:cfg.color, letterSpacing:1 }}>
          {seat.seatNo}
        </span>
        <span style={{
          fontSize:8, fontWeight:700, padding:"1px 5px", borderRadius:4,
          background: cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color,
          letterSpacing:0.5, textTransform:"uppercase"
        }}>
          {cfg.label}
        </span>
      </div>

      {/* Name */}
      <div style={{ fontSize:10.5, color:"#cbd5e1", fontWeight:600, marginBottom:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
        {seat.name}
      </div>

      {/* Route */}
      {!isReleased && (
        <div style={{ fontSize:9, color:"#64748b", display:"flex", alignItems:"center", gap:3, marginBottom:4 }}>
          <span style={{ color:"#94a3b8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:50 }}>{seat.boarding}</span>
          <span style={{ color:"#334155" }}>→</span>
          <span style={{ color:"#94a3b8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:50 }}>{seat.destination}</span>
        </div>
      )}

      {/* AI Score */}
      {seat.aiScore && (
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:8, color:"#475569" }}>AI</span>
          <div style={{
            height:3, flex:1, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden"
          }}>
            <div style={{
              height:"100%", width:`${seat.aiScore}%`,
              background: `linear-gradient(90deg, ${AI_SCORE_COLOR(seat.aiScore)}, ${AI_SCORE_COLOR(seat.aiScore)}aa)`,
              borderRadius:2,
              boxShadow:`0 0 4px ${AI_SCORE_COLOR(seat.aiScore)}`,
              transition:"width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize:8, color: AI_SCORE_COLOR(seat.aiScore), fontFamily:"monospace", fontWeight:700 }}>
            {seat.aiScore}
          </span>
        </div>
      )}

      {/* No-show badge */}
      {seat.noShowRisk && !isReleased && (
        <div style={{
          position:"absolute", top:4, right:4,
          width:6, height:6, borderRadius:"50%",
          background:"#ef4444", boxShadow:"0 0 6px #ef4444",
          animation:"blink 1.5s infinite",
        }} />
      )}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function SwapModal({ from, to, onConfirm, onCancel }) {
  if (!from || !to) return null;
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        background:"linear-gradient(135deg, rgba(15,23,42,0.98), rgba(2,8,23,0.98))",
        border:"1px solid rgba(56,189,248,0.3)", borderRadius:20, padding:28,
        width:380, boxShadow:"0 0 40px rgba(56,189,248,0.2)",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <span style={{ fontSize:18 }}>🤖</span>
          <span style={{ color:"#38bdf8", fontFamily:"monospace", fontWeight:700, fontSize:13, letterSpacing:1 }}>
            AI SWAP RECOMMENDATION
          </span>
        </div>
        <p style={{ color:"#94a3b8", fontSize:12, marginBottom:20, lineHeight:1.6 }}>
          AI recommends swapping seats to optimize passenger comfort and resolve family split alerts.
        </p>
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          {[from, to].map((s, i) => (
            <div key={i} style={{
              flex:1, background:"rgba(255,255,255,0.04)", borderRadius:12,
              padding:"10px 12px", border:`1px solid ${STATUS_CONFIG[s.status].border}`
            }}>
              <div style={{ fontSize:10, color:STATUS_CONFIG[s.status].color, fontWeight:700, marginBottom:3 }}>{s.seatNo}</div>
              <div style={{ fontSize:11, color:"#cbd5e1" }}>{s.name}</div>
              <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>{s.boarding} → {s.destination}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:"8px 0", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)",
            background:"transparent", color:"#64748b", cursor:"pointer", fontFamily:"monospace", fontSize:12,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:"8px 0", borderRadius:10, border:"none",
            background:"linear-gradient(90deg, #0ea5e9, #38bdf8)",
            color:"#fff", cursor:"pointer", fontFamily:"monospace", fontSize:12, fontWeight:700,
            boxShadow:"0 0 16px rgba(56,189,248,0.5)",
          }}>Confirm Swap ✓</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [stationIdx, setStationIdx] = useState(0);
  const [seats, setSeats] = useState(genSeats);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [highlighted, setHighlighted] = useState(new Set());
  const [swapFrom, setSwapFrom] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const toastId = useRef(0);

  function addToast(message, icon, color) {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, message, icon, color }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }

  function nextStation() {
    if (stationIdx >= STATIONS.length - 1) return;
    setTransitioning(true);
    setTimeout(() => {
      setStationIdx(i => i + 1);
      const newSeats = genSeats();
      setSeats(newSeats);
      setHighlighted(new Set());
      setSwapFrom(null);

      // Simulate events
      const racUpgraded = newSeats.filter(s => s.status === "occupied").slice(0,2);
      racUpgraded.forEach((s, i) => {
        setTimeout(() => {
          addToast(`${s.name} boarded at seat ${s.seatNo}`, "🚉", "#22c55e");
        }, i * 600);
      });
      setTimeout(() => addToast("2 RAC passengers upgraded to confirmed", "⬆️", "#eab308"), 1200);

      setTransitioning(false);
    }, 500);
  }

  function handleSeatClick(seat) {
    if (seat.status === "released") return;
    if (!swapFrom) {
      setSwapFrom(seat);
      setHighlighted(new Set([seat.id]));
    } else if (swapFrom.id !== seat.id) {
      setModal({ from: swapFrom, to: seat });
    } else {
      setSwapFrom(null);
      setHighlighted(new Set());
    }
  }

  function confirmSwap() {
    const { from, to } = modal;
    setSeats(prev => prev.map(s => {
      if (s.id === from.id) return { ...s, seatNo: to.seatNo, status: to.status };
      if (s.id === to.id) return { ...s, seatNo: from.seatNo, status: from.status };
      return s;
    }));
    addToast(`Seat swap confirmed: ${from.seatNo} ↔ ${to.seatNo}`, "🔄", "#38bdf8");
    setModal(null);
    setSwapFrom(null);
    setHighlighted(new Set());
  }

  const stats = {
    total: seats.length,
    occupied: seats.filter(s=>s.status==="occupied").length,
    rac: seats.filter(s=>s.status==="rac").length,
    released: seats.filter(s=>s.status==="released").length,
    unverified: seats.filter(s=>s.status==="unverified").length,
    noShow: seats.filter(s=>s.noShowRisk && s.status!=="released"),
  };

  const progress = ((stationIdx) / (STATIONS.length - 1)) * 100;
  const aiSwaps = seats.filter(s=>s.status==="rac").slice(0,3);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020817 0%, #0a1628 40%, #020817 100%)",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: "#e2e8f0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 2px; }
        @keyframes slideIn { from { transform: translateX(40px); opacity:0 } to { transform: translateX(0); opacity:1 } }
        @keyframes pulse-ring { 0%,100% { opacity:0.4; transform: scale(1) } 50% { opacity:0.1; transform: scale(1.04) } }
        @keyframes blink { 0%,100%{ opacity:1 } 50%{ opacity:0.2 } }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes scanline {
          0% { transform: translateY(-100%) }
          100% { transform: translateY(100vh) }
        }
        .stat-card { transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* Scanline overlay */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* Grid overlay */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        backgroundImage:`
          linear-gradient(rgba(56,189,248,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56,189,248,0.03) 1px, transparent 1px)
        `,
        backgroundSize:"40px 40px",
      }} />

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ── NAVBAR ── */}
        <nav style={{
          background: "rgba(2,8,23,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(56,189,248,0.15)",
          padding: "12px 24px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(56,189,248,0.1)",
        }}>
          <div style={{ maxWidth:1400, margin:"0 auto", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>

            {/* Logo + Title */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:"auto" }}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background:"linear-gradient(135deg, #0ea5e9, #0284c7)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18, boxShadow:"0 0 16px rgba(14,165,233,0.5)",
              }}>🚄</div>
              <div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:"#f1f5f9", letterSpacing:1, lineHeight:1.1 }}>
                  Smart Dynamic Seat Intelligence System
                </div>
                <div style={{ fontSize:9, color:"#38bdf8", letterSpacing:2, textTransform:"uppercase" }}>
                  National Railway Command Center
                </div>
              </div>
            </div>

            {/* Station badge */}
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.25)",
              borderRadius:10, padding:"6px 14px",
            }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e", animation:"blink 1.5s infinite" }} />
              <span style={{ fontSize:10, color:"#94a3b8", textTransform:"uppercase", letterSpacing:1 }}>CURRENT STN</span>
              <span style={{ fontSize:13, color:"#38bdf8", fontWeight:700 }}>🚆 {STATIONS[stationIdx]}</span>
            </div>

            {/* Progress */}
            <div style={{ width:180 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:8, color:"#475569" }}>
                <span>{STATIONS[0]}</span>
                <span>{STATIONS[STATIONS.length-1]}</span>
              </div>
              <div style={{ height:6, background:"rgba(255,255,255,0.05)", borderRadius:3, overflow:"hidden" }}>
                <div style={{
                  height:"100%", width:`${progress}%`,
                  background:"linear-gradient(90deg, #0ea5e9, #22c55e)",
                  borderRadius:3,
                  boxShadow:"0 0 8px rgba(14,165,233,0.6)",
                  transition:"width 0.6s ease",
                  position:"relative",
                }}>
                  <div style={{
                    position:"absolute", right:0, top:"50%", transform:"translateY(-50%)",
                    width:8, height:8, borderRadius:"50%",
                    background:"#fff", boxShadow:"0 0 8px #0ea5e9",
                  }} />
                </div>
              </div>
              <div style={{ fontSize:9, color:"#64748b", marginTop:3, textAlign:"center" }}>
                Station {stationIdx+1} / {STATIONS.length}
              </div>
            </div>

            {/* Next station button */}
            <button onClick={nextStation} disabled={stationIdx >= STATIONS.length-1 || transitioning}
              style={{
                padding:"8px 18px", borderRadius:10, border:"none",
                background: stationIdx >= STATIONS.length-1 ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(90deg, #0ea5e9, #38bdf8)",
                color: stationIdx >= STATIONS.length-1 ? "#475569" : "#fff",
                cursor: stationIdx >= STATIONS.length-1 ? "not-allowed" : "pointer",
                fontFamily:"'JetBrains Mono',monospace", fontWeight:700, fontSize:11,
                letterSpacing:1,
                boxShadow: stationIdx < STATIONS.length-1 ? "0 0 20px rgba(56,189,248,0.5), 0 0 40px rgba(56,189,248,0.2)" : "none",
                transition:"all 0.3s",
                display:"flex", alignItems:"center", gap:6,
              }}
            >
              {transitioning ? <span style={{ animation:"spin 0.8s linear infinite", display:"inline-block" }}>⟳</span> : ""}
              NEXT STATION →
            </button>
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main style={{ maxWidth:1400, margin:"0 auto", padding:"20px 24px", display:"flex", gap:18 }}>

          {/* ── LEFT: SEAT GRID ── */}
          <div style={{ flex:"0 0 68%", animation: transitioning ? "fadeSlide 0.4s ease" : "none" }}>
            <div style={{
              background:"rgba(15,23,42,0.6)", backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.06)", borderRadius:20, padding:20,
              boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
            }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:"#f1f5f9", letterSpacing:1 }}>
                    Seat Matrix
                  </div>
                  <div style={{ fontSize:9, color:"#475569", marginTop:1 }}>
                    {swapFrom ? `Selected: ${swapFrom.seatNo} — click another seat to swap` : "Click a seat to initiate swap"}
                  </div>
                </div>
                {/* Legend */}
                <div style={{ display:"flex", gap:10 }}>
                  {Object.entries(STATUS_CONFIG).map(([k,v])=>(
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:4, fontSize:9 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:v.color, boxShadow:`0 0 4px ${v.color}` }} />
                      <span style={{ color:"#64748b" }}>{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 }}>
                {seats.map(seat => (
                  <SeatCard key={seat.id} seat={seat} onClick={handleSeatClick} highlight={highlighted.has(seat.id)} />
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: AI PANEL ── */}
          <div style={{ flex:"0 0 30%", display:"flex", flexDirection:"column", gap:14 }}>

            {/* Stats Card */}
            <div style={{
              background:"rgba(15,23,42,0.6)", backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.06)", borderRadius:20, padding:18,
              boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                <span style={{ fontSize:12 }}>📊</span>
                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:"#f1f5f9", letterSpacing:1 }}>
                  OCCUPANCY STATS
                </span>
              </div>
              <DonutChart seats={seats} />
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", marginTop:14, paddingTop:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    ["Total Seats", stats.total, "#94a3b8"],
                    ["Occupied", stats.occupied, "#22c55e"],
                    ["RAC", stats.rac, "#eab308"],
                    ["Released", stats.released, "#3b82f6"],
                    ["Unverified", stats.unverified, "#ef4444"],
                    ["No-Show Risk", stats.noShow.length, "#f97316"],
                  ].map(([label, val, color]) => (
                    <div key={label} className="stat-card" style={{
                      background:"rgba(255,255,255,0.03)", borderRadius:10,
                      padding:"8px 10px", border:"1px solid rgba(255,255,255,0.05)",
                    }}>
                      <div style={{ fontSize:8, color:"#475569", textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:18, fontWeight:700, color, fontFamily:"'Rajdhani',sans-serif", lineHeight:1 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Family split alert */}
                {stats.rac > 0 && (
                  <div style={{
                    marginTop:10, padding:"8px 12px", borderRadius:10,
                    background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)",
                    display:"flex", alignItems:"center", gap:8,
                  }}>
                    <span style={{ animation:"blink 1.5s infinite", fontSize:12 }}>⚠️</span>
                    <div>
                      <div style={{ fontSize:10, color:"#eab308", fontWeight:700 }}>Family Split Alert</div>
                      <div style={{ fontSize:9, color:"#78716c" }}>{stats.rac} RAC passengers may need reallocation</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Suggestions */}
            <div style={{
              background:"rgba(15,23,42,0.6)", backdropFilter:"blur(12px)",
              border:"1px solid rgba(56,189,248,0.12)", borderRadius:20, padding:18,
              boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                <div style={{
                  width:22, height:22, borderRadius:6,
                  background:"linear-gradient(135deg, #0ea5e9, #6366f1)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:11,
                  boxShadow:"0 0 10px rgba(14,165,233,0.4)",
                }}>🤖</div>
                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:"#38bdf8", letterSpacing:1 }}>
                  AI RECOMMENDATIONS
                </span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {aiSwaps.length > 0 ? aiSwaps.map((seat, i) => (
                  <div key={seat.id} onClick={() => {
                    const target = seats.find(s => s.status === "released");
                    if (target) setModal({ from: seat, to: target });
                  }}
                  style={{
                    padding:"10px 12px", borderRadius:12, cursor:"pointer",
                    background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.15)",
                    transition:"all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(14,165,233,0.12)";
                    e.currentTarget.style.borderColor = "rgba(14,165,233,0.35)";
                    e.currentTarget.style.boxShadow = "0 0 16px rgba(14,165,233,0.15)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(14,165,233,0.06)";
                    e.currentTarget.style.borderColor = "rgba(14,165,233,0.15)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:10, color:"#38bdf8", fontWeight:700 }}>Upgrade {seat.seatNo}</span>
                      <span style={{ fontSize:9, padding:"1px 6px", borderRadius:4, background:"rgba(234,179,8,0.15)", color:"#eab308", border:"1px solid rgba(234,179,8,0.2)" }}>RAC → CNF</span>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>{seat.name}</div>
                    <div style={{ fontSize:9, color:"#475569", marginTop:2 }}>{seat.boarding} → {seat.destination}</div>
                  </div>
                )) : (
                  <div style={{ textAlign:"center", padding:"16px 0", color:"#475569", fontSize:11 }}>
                    ✓ All RAC seats cleared
                  </div>
                )}
              </div>

              {/* High no-show risk */}
              {stats.noShow.length > 0 && (
                <div style={{ marginTop:12, borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:12 }}>
                  <div style={{ fontSize:10, color:"#ef4444", fontWeight:700, marginBottom:8, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ animation:"blink 1.5s infinite" }}>●</span> HIGH NO-SHOW RISK
                  </div>
                  {stats.noShow.slice(0,3).map(s => (
                    <div key={s.id} style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"5px 8px", borderRadius:8, marginBottom:4,
                      background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.1)",
                    }}>
                      <span style={{ fontSize:10, color:"#fca5a5" }}>{s.name}</span>
                      <span style={{ fontSize:9, color:"#64748b" }}>{s.seatNo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Status */}
            <div style={{
              background:"rgba(15,23,42,0.6)", backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,0.06)", borderRadius:20, padding:18,
              boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                <span style={{ fontSize:11 }}>⚡</span>
                <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, color:"#f1f5f9", letterSpacing:1 }}>
                  SYSTEM STATUS
                </span>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"blink 1.5s infinite" }} />
                  <span style={{ fontSize:9, color:"#22c55e" }}>LIVE</span>
                </div>
              </div>
              {[
                ["AI Engine", "ACTIVE", "#22c55e"],
                ["Seat Sync", "SYNCED", "#22c55e"],
                ["PNR Verify", `${stats.unverified} PENDING`, stats.unverified > 0 ? "#ef4444" : "#22c55e"],
                ["Next Station", STATIONS[Math.min(stationIdx+1, STATIONS.length-1)], "#38bdf8"],
              ].map(([label, val, color]) => (
                <div key={label} style={{
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.03)",
                }}>
                  <span style={{ fontSize:10, color:"#475569" }}>{label}</span>
                  <span style={{ fontSize:10, color, fontWeight:700 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Swap Modal */}
      <SwapModal
        from={modal?.from} to={modal?.to}
        onConfirm={confirmSwap}
        onCancel={() => { setModal(null); setSwapFrom(null); setHighlighted(new Set()); }}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
