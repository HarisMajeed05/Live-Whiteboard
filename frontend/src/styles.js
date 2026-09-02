export const fonts = {
  display: "'Sora', 'Inter', sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

export const colors = {
  bg: '#0b0620',
  bgSoft: '#150c33',
  panel: 'rgba(255, 255, 255, 0.05)',
  panelSolid: '#160f34',
  border: 'rgba(255, 255, 255, 0.10)',
  text: '#f6f4ff',
  subtext: '#a79fd1',
  faint: '#6b6296',
  indigo: '#6c5ce7',
  lime: '#c6f135',
  coral: '#ff6b9d',
  danger: '#ff6b6b',
  gradientBrand: 'linear-gradient(135deg, #c6f135 0%, #6c5ce7 60%, #ff6b9d 100%)',
  gradientBrandSoft: 'linear-gradient(135deg, rgba(198,241,53,0.15), rgba(108,92,231,0.15))',
}

export const globalCss = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${fonts.body};
    background: ${colors.bg};
    color: ${colors.text};
    background-image:
      radial-gradient(circle at 15% 10%, rgba(108,92,231,0.22) 0%, transparent 40%),
      radial-gradient(circle at 85% 15%, rgba(198,241,53,0.14) 0%, transparent 42%),
      radial-gradient(circle at 50% 100%, rgba(255,107,157,0.12) 0%, transparent 45%);
    background-attachment: fixed;
  }
  ::placeholder { color: ${colors.faint}; }
  a { color: inherit; text-decoration: none; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }

  @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes floatBlob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(24px, -30px) scale(1.06); }
    66% { transform: translate(-18px, 18px) scale(0.96); }
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes drawStroke {
    to { stroke-dashoffset: 0; }
  }
  @keyframes popCursor {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3); }
  }
  @keyframes pulseRing {
    0% { box-shadow: 0 0 0 0 rgba(198,241,53,0.5); }
    100% { box-shadow: 0 0 0 14px rgba(198,241,53,0); }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .fade-in { animation: fadeIn 0.4s ease; }
  .msg-in { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .float-blob { animation: floatBlob 9s ease-in-out infinite; }
  .float-blob-slow { animation: floatBlob 13s ease-in-out infinite reverse; }
  .gradient-text {
    background: ${colors.gradientBrand};
    background-size: 200% 200%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: gradientShift 6s ease infinite;
  }
  .stagger > * { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
  .stagger > *:nth-child(1) { animation-delay: 0.04s; }
  .stagger > *:nth-child(2) { animation-delay: 0.09s; }
  .stagger > *:nth-child(3) { animation-delay: 0.14s; }
  .stagger > *:nth-child(4) { animation-delay: 0.19s; }
  .stagger > *:nth-child(5) { animation-delay: 0.24s; }
  .stagger > *:nth-child(n+6) { animation-delay: 0.29s; }

  .tap { transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
  .tap:active { transform: scale(0.95); }
  .nav-link:hover { background: rgba(255,255,255,0.07) !important; }

  .btn-gradient {
    background: ${colors.gradientBrand};
    background-size: 200% 200%;
    color: #100a26;
    transition: filter 0.2s ease, box-shadow 0.2s ease, background-position 0.6s ease;
    box-shadow: 0 10px 28px rgba(108,92,231,0.28);
  }
  .btn-gradient:hover { filter: brightness(1.06); background-position: 100% 0; }

  .input-glow:focus { border-color: rgba(198,241,53,0.5) !important; box-shadow: 0 0 0 3px rgba(198,241,53,0.12); }

  .tilt-card {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .tilt-card:hover {
    transform: translateY(-6px) rotate(-0.4deg);
    border-color: rgba(198,241,53,0.35) !important;
    box-shadow: 0 20px 44px rgba(0,0,0,0.45);
  }

  .pulse-dot { animation: pulseRing 1.8s ease-out infinite; }
`
