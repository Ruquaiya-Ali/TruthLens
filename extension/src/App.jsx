import { useState } from "react"

const API_URL = "https://truthlens-kr1s.onrender.com"

const orbs = (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    <div style={{
      position: "absolute", width: 320, height: 320, borderRadius: "50%",
      background: "radial-gradient(circle, #15803d 0%, transparent 70%)",
      top: -100, left: -80, filter: "blur(110px)", opacity: 0.28, mixBlendMode: "screen"
    }} />
    <div style={{
      position: "absolute", width: 280, height: 280, borderRadius: "50%",
      background: "radial-gradient(circle, #2aaefa 0%, transparent 70%)",
      bottom: -80, right: -60, filter: "blur(110px)", opacity: 0.28, mixBlendMode: "screen"
    }} />
    <div style={{
      position: "absolute", width: 200, height: 200, borderRadius: "50%",
      background: "radial-gradient(circle, #16a34a 0%, transparent 70%)",
      top: "40%", right: -40, filter: "blur(110px)", opacity: 0.2, mixBlendMode: "screen"
    }} />
  </div>
)

const skeletonStyle = `
  @keyframes tl-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.9; }
  }
`

function SkeletonCard({ lines = 2 }) {
  const bar = (width, delay = 0, height = 10) => (
    <div style={{
      height, borderRadius: 99, width,
      background: "rgba(255,255,255,0.08)",
      animation: `tl-pulse 1.5s ease-in-out ${delay}s infinite`,
      marginBottom: 8
    }} />
  )
  return (
    <Card>
      {bar("45%", 0, 9)}
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i}>{bar(i === lines - 1 ? "70%" : "100%", i * 0.12)}</div>
      ))}
    </Card>
  )
}

function ScoreBar({ score, colorFrom, colorTo }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99, height: 6, width: "100%", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${score}%`,
        background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
        borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)"
      }} />
    </div>
  )
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "rgba(15,15,15,0.85)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      padding: "14px 16px", ...style
    }}>
      {children}
    </div>
  )
}

function BiasSlider({ score }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#6dd5fa", letterSpacing: "0.05em" }}>LEFT</span>
        <span style={{ fontSize: 11, color: "#4b7a5a" }}>CENTER</span>
        <span style={{ fontSize: 11, color: "#22c55e", letterSpacing: "0.05em" }}>RIGHT</span>
      </div>
      <div style={{ position: "relative", height: 6, background: "linear-gradient(90deg, #2aaefa, rgba(255,255,255,0.1) 50%, #15803d)", borderRadius: 99 }}>
        <div style={{
          position: "absolute", top: "50%", left: `${score}%`,
          transform: "translate(-50%, -50%)",
          width: 14, height: 14, borderRadius: "50%",
          background: "white", boxShadow: "0 0 8px rgba(255,255,255,0.6)",
          transition: "left 0.8s cubic-bezier(0.4,0,0.2,1)"
        }} />
      </div>
    </div>
  )
}

function AnalyzeView({ onResults, onAnalyzing }) {
  const [input, setInput] = useState("")
  const [isUrl, setIsUrl] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError("")
    onAnalyzing()
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim(), is_url: false })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      onResults(data)
    } catch (e) {
      setError("Could not reach TruthLens server. Make sure the backend is running.")
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isUrl ? "https://example.com/article..." : "Paste article text here..."}
          style={{
            width: "100%", minHeight: 140, background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8,
            color: "#ecfdf5", fontSize: 13, padding: "10px 12px",
            resize: "vertical", fontFamily: "Outfit, sans-serif", outline: "none",
            lineHeight: 1.6
          }}
        />
        {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{error}</p>}
      </Card>

      <button onClick={handleAnalyze} disabled={loading || !input.trim()} style={{
        width: "100%", padding: "13px 0", borderRadius: 10, fontSize: 14, fontWeight: 600,
        fontFamily: "Plus Jakarta Sans, sans-serif", cursor: loading ? "wait" : "pointer",
        border: "none", letterSpacing: "0.02em",
        background: loading ? "rgba(22,163,74,0.3)" : "linear-gradient(135deg, #15803d, #16a34a, #2aaefa)",
        color: "white", opacity: !input.trim() ? 0.4 : 1, transition: "all 0.2s",
        boxShadow: loading ? "none" : "0 4px 20px rgba(22,163,74,0.3)"
      }}>
        {loading ? "Analyzing..." : "Analyze Article"}
      </button>

      <Card>
        <p style={{ fontSize: 11, color: "#4b7a5a", lineHeight: 1.6 }}>
          TruthLens uses AI to detect bias, credibility issues, emotional manipulation, and rhetorical tactics in news articles.
        </p>
      </Card>
    </div>
  )
}

function ResultsView({ data, loading }) {
  if (loading) return (
    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <SkeletonCard lines={2} />
      <SkeletonCard lines={1} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={3} />
    </div>
  )

  if (!data) return (
    <div style={{ padding: "40px 16px", textAlign: "center" }}>
      <p style={{ color: "#4b7a5a", fontSize: 14 }}>No results yet. Analyze an article first.</p>
    </div>
  )
const scores = [
    {
      label: "Credibility", icon: "🛡️",
      score: data.credibility_score, label2: data.credibility_label,
      colorFrom: "#2aaefa", colorTo: "#15803d",
      threshold: 60, thresholdLabel: "Above 60 is considered credible", higherIsBetter: true
    },
    {
      label: "Manipulation", icon: "⚠️",
      score: data.manipulation_score, label2: data.manipulation_label,
      colorFrom: "#16a34a", colorTo: "#f97316",
      threshold: 40, thresholdLabel: "Below 40 is considered safe", higherIsBetter: false
    },
    {
      label: "Rhetoric", icon: "🎭",
      score: data.rhetoric?.rhetoric_score ?? 0, label2: data.rhetoric?.rhetoric_label ?? "N/A",
      colorFrom: "#14532d", colorTo: "#16a34a",
      threshold: 40, thresholdLabel: "Below 40 is considered clean", higherIsBetter: false
    }
  ]

  return (
    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {data.summary && (
        <Card>
          <p style={{ fontSize: 11, color: "#6dd5fa", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>// SUMMARY</p>
          <p style={{ fontSize: 13, color: "#ecfdf5", lineHeight: 1.6 }}>{data.summary}</p>
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>⚖️ Political Bias</span>
          <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 500 }}>{data.bias_label}</span>
        </div>
        <BiasSlider score={data.bias_score} />
      </Card>

  {scores.map(s => {
  const safe = s.higherIsBetter ? s.score >= s.threshold : s.score < s.threshold
  return (
    <Card key={s.label}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{s.icon} {s.label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#4b7a5a" }}>{s.label2}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#ecfdf5" }}>{s.score}</span>
        </div>
      </div>
      <ScoreBar score={s.score} colorFrom={s.colorFrom} colorTo={s.colorTo} />
      <p style={{ fontSize: 11, marginTop: 7, color: safe ? "#22c55e" : "#f87171" }}>
        {safe ? "✓" : "✗"} {s.thresholdLabel}
      </p>
    </Card>
  )
})}

      {data.rhetoric?.devices_found?.length > 0 && (
        <Card>
          <p style={{ fontSize: 11, color: "#6dd5fa", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>// RHETORIC DEVICES</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {data.rhetoric.devices_found.map(d => (
              <span key={d} style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 99,
                background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)",
                color: "#bbf7d0"
              }}>{d}</span>
            ))}
          </div>
          {data.rhetoric.loaded_language?.length > 0 && (
            <>
              <p style={{ fontSize: 11, color: "#6dd5fa", letterSpacing: "0.3em", textTransform: "uppercase", margin: "10px 0 8px" }}>// LOADED LANGUAGE</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {data.rhetoric.loaded_language.map(w => (
                  <span key={w} style={{
                    fontSize: 11, padding: "4px 10px", borderRadius: 99,
                    background: "rgba(20,83,45,0.12)", border: "1px solid rgba(20,83,45,0.25)",
                    color: "#22c55e"
                  }}>{w}</span>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {data.key_claims?.length > 0 && (
        <Card>
          <p style={{ fontSize: 11, color: "#6dd5fa", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>// KEY CLAIMS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.key_claims.map((claim, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#16a34a", fontSize: 12, marginTop: 2, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 12, color: "#ecfdf5", lineHeight: 1.6 }}>{claim}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function HistoryView({ history, onSelect }) {
  if (history.length === 0) return (
    <div style={{ padding: "40px 16px", textAlign: "center" }}>
      <p style={{ color: "#4b7a5a", fontSize: 14 }}>No history yet.</p>
    </div>
  )

  return (
    <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      {history.map((item, i) => (
        <Card key={i} style={{ cursor: "pointer" }} onClick={() => onSelect(item)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#22c55e" }}>{item.bias_label}</span>
            <span style={{ fontSize: 11, color: "#4b7a5a" }}>Credibility: {item.credibility_score}</span>
          </div>
          <p style={{ fontSize: 12, color: "#ecfdf5", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.summary}
          </p>
        </Card>
      ))}
    </div>
  )
}

export default function App() {
  const [view, setView] = useState("analyze")
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const handleAnalyzing = () => {
    setLoading(true)
    setView("results")
  }

  const handleResults = (data) => {
    setResults(data)
    setHistory(prev => [data, ...prev].slice(0, 10))
    setLoading(false)
    setView("results")
  }

  const navItems = [
    { id: "analyze", label: "Analyze", icon: "🔍" },
    { id: "results", label: "Results", icon: "📊" },
    { id: "history", label: "History", icon: "🕐" }
  ]

  return (
    <div style={{ width: 360, minHeight: 580, background: "#000000", position: "relative", display: "flex", flexDirection: "column" }}>
      <style>{skeletonStyle}</style>
      {orbs}

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 10, padding: "16px 16px 12px",
        backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #15803d, #16a34a, #2aaefa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 4px 12px rgba(22,163,74,0.4)"
          }}>🔎</div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.02em", lineHeight: 1, color: "#ecfdf5" }}>TruthLens</h1>
            <p style={{ fontSize: 10, color: "#4b7a5a", letterSpacing: "0.1em", marginTop: 2 }}>MEDIA ANALYSIS ENGINE</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 12, position: "relative", zIndex: 1 }}>
        {view === "analyze" && <AnalyzeView onResults={handleResults} onAnalyzing={handleAnalyzing} />}
        {view === "results" && <ResultsView data={results} loading={loading} />}
        {view === "history" && <HistoryView history={history} onSelect={(item) => { setResults(item); setView("results") }} />}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "relative", zIndex: 10, display: "flex",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)", background: "rgba(0,0,0,0.8)"
      }}>
        {navItems.map(item => {
          const active = view === item.id
          return (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              flex: 1, padding: "10px 0", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, border: "none", background: "transparent",
              cursor: "pointer", position: "relative", transition: "all 0.2s"
            }}>
              {active && <div style={{
                position: "absolute", top: 0, left: "20%", right: "20%", height: 2, borderRadius: 99,
                background: "linear-gradient(90deg, #15803d, #16a34a)"
              }} />}
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: active ? "#22c55e" : "#4b7a5a", fontWeight: active ? 600 : 400 }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Footer */}
<div style={{
  position: "relative", zIndex: 10, textAlign: "center",
  padding: "6px 0", borderTop: "1px solid rgba(255,255,255,0.04)",
  background: "rgba(0,0,0,0.8)"
}}>
  <p style={{ fontSize: 10, color: "#4b7a5a", letterSpacing: "0.08em" }}>
    © 2026 Ruquaiya Ali. All rights reserved.
  </p>
</div>

    </div>
  )
}