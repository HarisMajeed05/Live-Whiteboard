export default function DrawingHero() {
  return (
    <svg viewBox="0 0 400 300" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c6f135" />
          <stop offset="60%" stopColor="#6c5ce7" />
          <stop offset="100%" stopColor="#ff6b9d" />
        </linearGradient>
      </defs>

      <rect
        x="60" y="60" width="180" height="120" rx="14"
        fill="none" stroke="url(#strokeGrad)" strokeWidth="4"
        strokeDasharray="620" strokeDashoffset="620"
        style={{ animation: 'drawStroke 2.6s cubic-bezier(0.65,0,0.35,1) infinite' }}
      />

      <circle
        cx="300" cy="180" r="46"
        fill="none" stroke="#c6f135" strokeWidth="4"
        strokeDasharray="290" strokeDashoffset="290"
        style={{ animation: 'drawStroke 2.6s cubic-bezier(0.65,0,0.35,1) infinite 0.5s' }}
      />

      <path
        d="M100 220 Q 140 190 170 220 T 240 220"
        fill="none" stroke="#ff6b9d" strokeWidth="4" strokeLinecap="round"
        strokeDasharray="180" strokeDashoffset="180"
        style={{ animation: 'drawStroke 2.6s cubic-bezier(0.65,0,0.35,1) infinite 1s' }}
      />

      <circle cx="240" cy="60" r="7" fill="#c6f135" className="pulse-dot" />
    </svg>
  )
}
