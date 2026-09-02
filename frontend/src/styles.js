export const fonts = {
  display: "'Space Grotesk', 'Inter', sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}

export const colors = {
  bg: '#08090d',
  panel: 'rgba(255, 255, 255, 0.045)',
  panelSolid: '#12131b',
  border: 'rgba(255, 255, 255, 0.09)',
  text: '#f4f5f8',
  subtext: '#9096a4',
  faint: '#5a6070',
  cyan: '#3ee8dc',
  violet: '#8b7bf7',
  danger: '#ff6b6b',
  gradientBrand: 'linear-gradient(135deg, #3ee8dc 0%, #8b7bf7 100%)',
}

export const globalCss = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${fonts.body};
    background: ${colors.bg};
    color: ${colors.text};
    background-image:
      radial-gradient(circle at 12% 8%, rgba(62,232,220,0.12) 0%, transparent 38%),
      radial-gradient(circle at 88% 18%, rgba(139,123,247,0.12) 0%, transparent 40%);
    background-attachment: fixed;
    overflow: hidden;
  }
  ::placeholder { color: ${colors.faint}; }
  a { color: inherit; text-decoration: none; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }

  @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .fade-in { animation: fadeIn 0.3s ease; }
  .msg-in { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  .tap { transition: transform 0.15s cubic-bezier(0.16, 1, 0.3, 1); }
  .tap:active { transform: scale(0.95); }
  .nav-link:hover { background: rgba(255,255,255,0.06) !important; }
  .btn-gradient {
    background: linear-gradient(135deg, #3ee8dc 0%, #8b7bf7 100%);
    transition: filter 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 8px 24px rgba(62,232,220,0.18);
  }
  .btn-gradient:hover { filter: brightness(1.08); }
  .input-glow:focus { border-color: rgba(62,232,220,0.5) !important; box-shadow: 0 0 0 3px rgba(62,232,220,0.12); }
  .glow-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
  .glow-card:hover { transform: translateY(-2px); border-color: rgba(62,232,220,0.35) !important; box-shadow: 0 14px 34px rgba(0,0,0,0.4); }
`
