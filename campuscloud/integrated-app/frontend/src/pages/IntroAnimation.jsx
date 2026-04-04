import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

/*
 *  GPU Intro Animation
 *  ───────────────────
 *  3-second full-screen animation featuring:
 *    – floating particle field (simulates compute data flow)
 *    – 3D-style GPU chip that assembles from edges then glows
 *    – spinning fan blades
 *    – RGB accent strip
 *    – progress bar with "Initializing Compute…" text
 *    – entire scene fades out before navigating
 *  Pure CSS animations, zero heavy deps.
 */

const ANIM_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

  /* ── Root ── */
  .intro-root {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: #06080e;
    font-family: 'Plus Jakarta Sans', sans-serif;
    overflow: hidden;
    transition: opacity 0.5s ease;
  }
  .intro-root.fade-out { opacity: 0; }

  /* ── Particle field ── */
  .intro-particle {
    position: absolute; border-radius: 50%;
    pointer-events: none;
    animation: particleRise linear infinite;
  }
  @keyframes particleRise {
    0%   { transform: translateY(0) scale(1); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(-100vh) scale(0.4); opacity: 0; }
  }

  /* ── Neon grid floor ── */
  .intro-grid {
    position: absolute;
    bottom: 0; left: -10%; width: 120%; height: 45%;
    background:
      linear-gradient(90deg, rgba(124,77,255,0.08) 1px, transparent 1px),
      linear-gradient(0deg,   rgba(124,77,255,0.08) 1px, transparent 1px);
    background-size: 48px 48px;
    transform: perspective(400px) rotateX(55deg);
    transform-origin: center bottom;
    mask-image: linear-gradient(to top, rgba(0,0,0,0.5), transparent 80%);
    -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.5), transparent 80%);
    animation: gridScroll 3s linear infinite;
    pointer-events: none;
  }
  @keyframes gridScroll {
    0%   { background-position: 0 0, 0 0; }
    100% { background-position: 0 48px, 0 48px; }
  }

  /* ── Center stage ── */
  .intro-stage {
    position: relative; z-index: 10;
    display: flex; flex-direction: column;
    align-items: center;
    animation: stageIn 0.7s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes stageIn {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* ── GPU Card body ── */
  .intro-gpu {
    width: 160px; height: 200px;
    position: relative;
    border-radius: 10px;
    background: linear-gradient(160deg, #1a1e30 0%, #12141f 60%, #0c0e17 100%);
    border: 1.5px solid rgba(124,77,255,0.25);
    box-shadow:
      0 0 40px rgba(124,77,255,0.12),
      0 20px 50px rgba(0,0,0,0.7);
    animation: gpuFloat 3.5s ease-in-out infinite;
  }
  @keyframes gpuFloat {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-12px); }
  }

  /* Edge glow that draws in */
  .intro-gpu::after {
    content: '';
    position: absolute; inset: -2px;
    border-radius: 12px;
    background: conic-gradient(from 0deg, #7c4dff, #00e5ff, #e040fb, #7c4dff);
    opacity: 0;
    animation: edgeGlow 2.5s 0.3s ease-in-out forwards;
    z-index: -1;
    filter: blur(3px);
  }
  @keyframes edgeGlow {
    0%   { opacity: 0; }
    40%  { opacity: 0.5; }
    70%  { opacity: 0.8; }
    100% { opacity: 0.35; }
  }

  /* ── PCB texture lines ── */
  .intro-pcb {
    position: absolute;
    background: rgba(124,77,255,0.08);
    opacity: 0;
    animation: pcbReveal 0.6s 0.8s ease forwards;
  }
  @keyframes pcbReveal { to { opacity: 1; } }

  /* ── Fan housings ── */
  .intro-fans {
    display: flex; justify-content: center; gap: 10px;
    padding: 14px 12px 6px;
  }
  .intro-fan-housing {
    width: 56px; height: 56px;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 35%, #20243a, #0e1020);
    border: 2px solid #1e2236;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .intro-fan-svg {
    animation: none;
    opacity: 0.4;
    transition: opacity 0.5s;
  }
  .fans-on .intro-fan-svg {
    opacity: 1;
    filter: drop-shadow(0 0 3px rgba(100,160,255,0.5));
  }
  .intro-blades {
    transform-origin: 28px 28px;
  }
  .fans-on .intro-blades {
    animation: spinBlade 0.5s linear infinite;
  }
  @keyframes spinBlade { to { transform: rotate(360deg); } }

  /* ── Heatsink fins ── */
  .intro-fins {
    display: flex; gap: 2px; padding: 0 12px; margin-top: 4px;
  }
  .intro-fin {
    flex: 1; height: 24px;
    background: #16192a;
    border-radius: 2px 2px 0 0;
    border-top: 1.5px solid #1e2236;
    transition: border-color 0.4s, box-shadow 0.4s;
  }
  .fins-on .intro-fin:nth-child(1) { border-color: #ff3060; box-shadow: 0 -3px 7px #ff306060; }
  .fins-on .intro-fin:nth-child(2) { border-color: #ff8800; box-shadow: 0 -3px 7px #ff880060; }
  .fins-on .intro-fin:nth-child(3) { border-color: #ffee00; box-shadow: 0 -3px 7px #ffee0060; }
  .fins-on .intro-fin:nth-child(4) { border-color: #00ee44; box-shadow: 0 -3px 7px #00ee4460; }
  .fins-on .intro-fin:nth-child(5) { border-color: #00aaff; box-shadow: 0 -3px 7px #00aaff60; }
  .fins-on .intro-fin:nth-child(6) { border-color: #aa44ff; box-shadow: 0 -3px 7px #aa44ff60; }
  .fins-on .intro-fin:nth-child(7) { border-color: #ff3060; box-shadow: 0 -3px 7px #ff306060; }
  .fins-on .intro-fin:nth-child(8) { border-color: #00aaff; box-shadow: 0 -3px 7px #00aaff60; }

  /* ── RGB accent bar ── */
  .intro-rgb-bar {
    position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
    border-radius: 0 0 10px 10px;
    background: transparent;
    transition: all 0.5s;
  }
  .rgb-on .intro-rgb-bar {
    background: linear-gradient(90deg, #ff3060,#ff8800,#ffee00,#00ee44,#00aaff,#aa44ff,#ff3060);
    background-size: 200%;
    animation: rgbShift 1.5s linear infinite;
    box-shadow: 0 4px 14px rgba(100,100,255,0.4);
  }
  @keyframes rgbShift { to { background-position: 200% 0; } }

  /* ── RGB side ── */
  .intro-rgb-side {
    position: absolute; left: 0; top: 18%; bottom: 18%; width: 3px;
    border-radius: 2px 0 0 2px;
    background: transparent;
    transition: all 0.5s;
  }
  .rgb-on .intro-rgb-side {
    background: linear-gradient(180deg, #ff3060, #00aaff, #aa44ff);
    box-shadow: -3px 0 10px rgba(100,100,255,0.4);
  }

  /* ── Label ── */
  .intro-gpu-label {
    text-align: center; padding: 4px 0 0;
    font-size: 9px; letter-spacing: 2px;
    color: #333;
    transition: color 0.5s, text-shadow 0.5s;
  }
  .label-on .intro-gpu-label {
    color: #80c8ff;
    text-shadow: 0 0 8px rgba(80,180,255,0.5);
  }

  /* ── IO bracket ── */
  .intro-io {
    width: 160px; height: 14px;
    background: #0e1018; border: 1.5px solid #1a1e30;
    border-top: none; border-radius: 0 0 8px 8px;
    display: flex; align-items: center; justify-content: center; gap: 4px;
    margin-bottom: 32px;
  }
  .intro-io-port {
    width: 14px; height: 6px; border-radius: 2px;
    background: #0a0d14; border: 1px solid #1e2236;
    transition: border-color 0.4s, box-shadow 0.4s;
  }
  .ports-on .intro-io-port:nth-child(odd) { border-color: #00aaff; box-shadow: 0 0 4px #00aaff60; }
  .ports-on .intro-io-port:nth-child(even) { border-color: #aa44ff; box-shadow: 0 0 4px #aa44ff60; }

  /* ── Progress bar ── */
  .intro-progress-wrap {
    width: 220px; margin-top: 8px;
  }
  .intro-progress-text {
    font-size: 11px; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.3);
    margin-bottom: 8px; text-align: center;
    animation: textPulse 1.8s ease-in-out infinite;
  }
  @keyframes textPulse {
    0%,100% { opacity: 0.3; }
    50%     { opacity: 0.8; }
  }
  .intro-progress-track {
    height: 3px; border-radius: 2px;
    background: rgba(255,255,255,0.06);
    overflow: hidden;
  }
  .intro-progress-fill {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, #7c4dff, #00e5ff);
    width: 0%;
    animation: progressGrow 2.8s 0.3s cubic-bezier(.22,1,.36,1) forwards;
  }
  @keyframes progressGrow { to { width: 100%; } }

  /* ── Branding ── */
  .intro-brand {
    position: absolute; bottom: 28px; z-index: 10;
    text-align: center;
    animation: stageIn 0.7s 0.2s cubic-bezier(.22,1,.36,1) both;
  }
  .intro-brand-name {
    font-size: 18px; font-weight: 800; color: #fff;
    letter-spacing: -0.02em;
  }
  .intro-brand-accent { color: #a78bfa; }
  .intro-brand-sub {
    font-size: 10px; color: rgba(255,255,255,0.25);
    letter-spacing: 0.1em; margin-top: 4px;
  }
`;

const BLADE_ANGLES = [0, 60, 120, 180, 240, 300];

function IntroAnimation() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0); // 0=assemble, 1=power-on, 2=fade-out
  const [fading, setFading] = useState(false);

  // Particle data (memoised, stable across renders)
  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${(i * 2.47) % 100}%`,
      size: 1.5 + (i % 3),
      color: i % 3 === 0 ? '#7c4dff' : i % 3 === 1 ? '#00e5ff' : '#e040fb',
      duration: `${4 + (i % 5) * 1.2}s`,
      delay: `${(i % 8) * 0.4}s`,
    })), []);

  useEffect(() => {
    // Phase 1: power on GPU at 0.8s
    const t1 = setTimeout(() => setPhase(1), 800);
    // Phase 2: begin fade at 2.8s
    const t2 = setTimeout(() => { setPhase(2); setFading(true); }, 2800);
    // Navigate at 3.3s (after 0.5s fade)
    const t3 = setTimeout(() => {
      try { navigate("/login", { replace: true }); }
      catch { window.location.href = "/login"; }
    }, 3300);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [navigate]);

  const powered = phase >= 1;

  return (
    <div className={`intro-root ${fading ? 'fade-out' : ''}`}>
      <style>{ANIM_STYLES}</style>

      {/* Particle field */}
      {particles.map(p => (
        <div
          key={p.id}
          className="intro-particle"
          style={{
            left: p.left, bottom: '-4px',
            width: p.size, height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}

      {/* Neon grid floor */}
      <div className="intro-grid" />

      {/* Center stage */}
      <div className="intro-stage">

        {/* GPU card */}
        <div className={`intro-gpu ${powered ? 'rgb-on label-on' : ''}`}>
          <div className="intro-rgb-side" />
          <div className="intro-rgb-bar" />

          {/* PCB texture */}
          <div className="intro-pcb" style={{top:8,left:12,width:35,height:1}} />
          <div className="intro-pcb" style={{top:12,left:12,width:18,height:1}} />
          <div className="intro-pcb" style={{top:8,left:12,width:1,height:25}} />
          <div className="intro-pcb" style={{top:8,right:12,width:24,height:1}} />
          <div className="intro-pcb" style={{top:8,right:12,width:1,height:16}} />

          {/* Fans */}
          <div className={`intro-fans ${powered ? 'fans-on' : ''}`}>
            {[false, true].map((offset, fi) => (
              <div key={fi} className="intro-fan-housing">
                <svg className="intro-fan-svg" width="50" height="50" viewBox="0 0 56 56" fill="none">
                  <g className="intro-blades" style={offset ? {animationDelay:'-0.25s'} : undefined}>
                    {BLADE_ANGLES.map((angle, bi) => (
                      <ellipse
                        key={bi} cx="28" cy="16" rx="6" ry="12"
                        fill={bi % 2 === 0 ? '#181c2e' : '#1c2038'}
                        transform={angle ? `rotate(${angle} 28 28)` : undefined}
                      />
                    ))}
                  </g>
                  <circle cx="28" cy="28" r="5" fill="#181c2e" />
                  <circle cx="28" cy="28" r="2.5" fill="#222640" />
                </svg>
              </div>
            ))}
          </div>

          {/* Heatsink */}
          <div className={`intro-fins ${powered ? 'fins-on' : ''}`}>
            {Array.from({length:8}).map((_,i) => <div key={i} className="intro-fin" />)}
          </div>

          {/* Label */}
          <div className="intro-gpu-label">RTX 5090 · 24 GB</div>
        </div>

        {/* IO bracket */}
        <div className={`intro-io ${powered ? 'ports-on' : ''}`}>
          {[1,2,3,4].map(n => <div key={n} className="intro-io-port" />)}
        </div>

        {/* Progress */}
        <div className="intro-progress-wrap">
          <div className="intro-progress-text">Initializing Compute…</div>
          <div className="intro-progress-track">
            <div className="intro-progress-fill" />
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="intro-brand">
        <div className="intro-brand-name">
          Campus<span className="intro-brand-accent">Cloud</span>
        </div>
        <div className="intro-brand-sub">GPU JOB PLATFORM</div>
      </div>
    </div>
  );
}

export default IntroAnimation;
