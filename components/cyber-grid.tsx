/**
 * CyberGrid — global decorative background (neon 3D "hacker" grid).
 * Pure CSS (no canvas / no JS animation loop): an animated perspective
 * floor rushing toward the viewer, a glowing horizon line, a faint sky
 * grid, CRT scanlines and one slow scan beam. Sits behind all content
 * (z-index: -10) and never captures pointer events.
 * Styles live in globals.css under "Neon 3D grid background".
 */
export function CyberGrid() {
  return (
    <div aria-hidden className="cyber-grid">
      <div className="cyber-grid-glow" />
      <div className="cyber-grid-floor" />
      <div className="cyber-grid-horizon" />
      <div className="cyber-grid-beam-h" />
    </div>
  );
}
