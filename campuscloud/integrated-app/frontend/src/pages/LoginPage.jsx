import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

/* ═══════════════════════════════════════════
   COMBINED GPU INTRO + LOGIN PAGE
   ───────────────────────────────────────────
   Flow:  /  →  GPU animation plays (≈7s)
              →  login card rises
              →  user signs in → /dashboard
   ═══════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@300;400;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{--c:#00d4ff;--p:#bb55ff;--g:#00ff88;--bg:#04060e;--card:#080c18;}

/* ═══ ENV ═══ */
.gpu-page{position:fixed;inset:0;overflow:hidden;background:var(--bg);font-family:'Rajdhani',sans-serif;}

#env{position:fixed;inset:0;z-index:0;
  background:
    radial-gradient(ellipse 100% 60% at 50% 110%,rgba(0,30,60,.9) 0%,transparent 60%),
    linear-gradient(180deg,#030508 0%,#060d1a 60%,#08111e 100%);}

.wline{position:fixed;background:var(--c);z-index:1;}
.wl{top:8%;left:0;width:2px;height:60%;box-shadow:0 0 18px 5px rgba(0,85,255,.5),0 0 60px 8px rgba(0,85,255,.15);}
.wr{top:4%;right:0;width:2px;height:75%;box-shadow:0 0 18px 5px rgba(0,85,255,.5);animation:wPulse 3s ease-in-out infinite alternate .8s;}
.wt{top:0;left:8%;width:84%;height:2px;box-shadow:0 0 18px 5px rgba(0,85,255,.4);animation:wPulse 3s ease-in-out infinite alternate .4s;}
@keyframes wPulse{0%{opacity:.4}100%{opacity:.95}}

#floor{position:fixed;bottom:0;left:0;right:0;height:220px;z-index:1;
  background:
    linear-gradient(rgba(0,85,255,.05) 1px,transparent 1px),
    linear-gradient(90deg,rgba(0,85,255,.05) 1px,transparent 1px);
  background-size:55px 55px;
  transform:perspective(250px) rotateX(62deg);transform-origin:bottom;
  mask-image:linear-gradient(to top,rgba(0,0,0,.7),transparent);
  -webkit-mask-image:linear-gradient(to top,rgba(0,0,0,.7),transparent);
}

#table-glow{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
  width:700px;height:60px;background:radial-gradient(ellipse at center,rgba(0,85,255,.18),transparent 70%);
  filter:blur(8px);z-index:2;opacity:0;transition:opacity 1s;}

/* Dust */
.dp{position:absolute;border-radius:50%;animation:dustFloat linear infinite;opacity:0;}
@keyframes dustFloat{0%{transform:translateY(100vh);opacity:0}10%{opacity:.7}90%{opacity:.3}100%{transform:translateY(-5vh);opacity:0}}

/* ═══ STAGE ═══ */
#stage{position:fixed;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;}
#gpu-world{position:relative;transform-style:preserve-3d;perspective:900px;}
#gpu-container{position:relative;transform-style:preserve-3d;
  transform:rotateX(22deg) rotateY(-28deg);
  animation:gpuDrop 1s cubic-bezier(.22,1,.36,1) both;}
@keyframes gpuDrop{
  from{transform:rotateX(22deg) rotateY(-28deg) translateY(-180px) translateZ(60px);opacity:0;}
  to{transform:rotateX(22deg) rotateY(-28deg) translateY(0) translateZ(0);opacity:1;}}

/* GPU body */
#gpu-body{position:relative;width:420px;height:150px;
  background:linear-gradient(145deg,#1c2030 0%,#0f1220 55%,#0a0c18 100%);
  border-radius:12px 12px 5px 5px;border:1.5px solid rgba(0,85,255,.12);
  box-shadow:0 20px 60px rgba(0,0,0,.8),0 0 0 1px rgba(0,85,255,.04),inset 0 1px 0 rgba(255,255,255,.04);
  overflow:visible;transition:box-shadow .8s;}

#panel-top{position:absolute;top:0;left:0;right:0;height:50%;
  background:linear-gradient(180deg,#1e2438,#131828);border-radius:12px 12px 0 0;
  transform-origin:top center;transition:transform 1.2s cubic-bezier(.22,1,.36,1),opacity .8s;
  border-bottom:1px solid rgba(0,85,255,.08);}
#panel-bottom{position:absolute;bottom:0;left:0;right:0;height:50%;
  background:linear-gradient(180deg,#131828,#0a0c18);border-radius:0 0 5px 5px;
  transform-origin:bottom center;transition:transform 1.2s cubic-bezier(.22,1,.36,1) .1s,opacity .8s;}

#rgb-bar{position:absolute;bottom:0;left:0;right:0;height:5px;border-radius:0 0 5px 5px;
  background:linear-gradient(90deg,#ff2060,#ff7700,#ffee00,#00ee55,var(--c),var(--p),#ff2060);
  background-size:300%;animation:rgbShift 2s linear infinite;
  box-shadow:0 4px 24px rgba(0,200,255,.5);opacity:0;transition:opacity 1s;}
@keyframes rgbShift{to{background-position:300% 0}}

#rgb-side{position:absolute;top:15%;bottom:15%;left:0;width:4px;border-radius:3px 0 0 3px;
  background:linear-gradient(180deg,var(--c),var(--p));box-shadow:-4px 0 14px rgba(0,200,255,.6);
  animation:rgbSideAnim 1.8s linear infinite alternate;opacity:0;transition:opacity 1s;}
@keyframes rgbSideAnim{to{background:linear-gradient(180deg,var(--p),var(--c));}}

/* Heatsink */
#heatsink{position:absolute;left:-42px;top:10px;bottom:10px;display:flex;flex-direction:column;gap:3px;
  transition:transform 1.2s cubic-bezier(.22,1,.36,1),opacity .6s;}
.fin{flex:1;width:40px;background:linear-gradient(90deg,#0e1020,#181c2a);
  border-left:2px solid rgba(0,85,255,.0);border-radius:3px 0 0 3px;
  transition:border-color .5s,box-shadow .5s;}
.fin-on{border-left-color:rgba(0,85,255,.6)!important;box-shadow:-3px 0 10px rgba(0,85,255,.3)!important;}

/* Brand */
#brand-panel{position:absolute;left:14px;top:50%;transform:translateY(-50%);
  display:flex;flex-direction:column;align-items:center;gap:5px;transition:opacity .8s;}
.b-diamond{width:30px;height:30px;background:linear-gradient(135deg,#0066cc,#00aaff);
  clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);
  filter:drop-shadow(0 0 10px rgba(0,170,255,.9));animation:dPulse 2s ease-in-out infinite alternate;}
@keyframes dPulse{0%{filter:drop-shadow(0 0 6px rgba(0,170,255,.5))}100%{filter:drop-shadow(0 0 18px rgba(0,85,255,1))}}
.b-text{font-family:'Orbitron',monospace;font-size:14px;font-weight:900;
  color:rgba(255,255,255,.92);letter-spacing:3px;text-shadow:0 0 20px rgba(0,85,255,.5);}

/* PCB */
.pcb{position:absolute;background:rgba(0,85,255,.06);}

#model-label{position:absolute;bottom:8px;right:16px;
  font-family:'Share Tech Mono',monospace;font-size:8px;
  color:rgba(0,85,255,.4);letter-spacing:3px;text-shadow:0 0 8px rgba(0,85,255,.4);
  opacity:0;transition:opacity 1s 2.5s;}

/* Fans */
.fan-wrap{position:absolute;top:50%;transform:translateY(-50%);
  transition:transform 1.4s cubic-bezier(.22,1,.36,1),opacity .6s;}
#fan1{right:20px;}#fan2{right:120px;}#fan3{right:220px;}
.fan-outer{width:92px;height:92px;border-radius:50%;position:relative;
  display:flex;align-items:center;justify-content:center;}
.fan-ring-glow{position:absolute;inset:-4px;border-radius:50%;
  background:conic-gradient(var(--c) 0deg,transparent 100deg,var(--p) 200deg,transparent 300deg,var(--c) 360deg);
  mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#fff calc(100% - 3px));
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#fff calc(100% - 3px));
  animation:ringRot 1.8s linear infinite;opacity:0;transition:opacity 1s;filter:blur(.5px);}
@keyframes ringRot{to{transform:rotate(360deg)}}
.fan-ring-glow-outer{position:absolute;inset:-4px;border-radius:50%;
  box-shadow:0 0 14px 3px rgba(0,85,255,.5),0 0 30px 8px rgba(0,85,255,.15);
  opacity:0;transition:opacity 1s;animation:ringPls 2s ease-in-out infinite alternate;}
@keyframes ringPls{0%{opacity:.3}100%{opacity:.8}}
.fan-housing{width:86px;height:86px;border-radius:50%;
  background:radial-gradient(circle at 35% 32%,#1e2338,#0c0e1a);
  border:1.5px solid rgba(255,255,255,.06);
  display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
.blade-g{transform-origin:34px 34px;animation:bladeSpinA .65s linear infinite;animation-play-state:paused;}
@keyframes bladeSpinA{to{transform:rotate(360deg)}}
.fan-center{fill:#141820;}.fan-center-dot{fill:var(--c);opacity:.7;}
.screw{position:absolute;width:9px;height:9px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#2a2e40,#0e1018);border:1px solid rgba(255,255,255,.07);}

/* IO */
#io{position:absolute;bottom:-18px;left:0;right:0;height:18px;
  background:#0d0f1a;border:1.5px solid rgba(0,85,255,.08);border-top:none;
  border-radius:0 0 8px 8px;display:flex;align-items:center;justify-content:center;gap:5px;
  transition:opacity .6s;}
.io-port{width:22px;height:10px;border-radius:2px;
  background:#080a14;border:1px solid rgba(0,85,255,.15);box-shadow:0 0 5px rgba(0,85,255,.2);}

/* Shadow / reflect */
#reflect{position:absolute;bottom:-26px;left:50%;transform:translateX(-50%);
  width:420px;height:3px;
  background:linear-gradient(90deg,transparent,rgba(0,85,255,.4),rgba(170,85,255,.3),transparent);
  filter:blur(2px);opacity:0;transition:opacity 1s;border-radius:50%;}
#shadow-el{position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);
  width:380px;height:40px;
  background:radial-gradient(ellipse,rgba(0,0,0,.8),transparent 70%);
  filter:blur(6px);opacity:0;transition:opacity 1s;}

/* ═══ LOGIN OVERLAY ═══ */
#login-overlay{position:fixed;inset:0;z-index:50;
  display:flex;align-items:center;justify-content:center;
  pointer-events:none;opacity:0;}
#login-overlay.visible{pointer-events:all;opacity:1;}
#login-backdrop{position:fixed;inset:0;
  background:rgba(4,6,14,.82);backdrop-filter:blur(4px);
  opacity:0;transition:opacity .8s;}

#login-card{position:relative;z-index:51;width:360px;
  background:rgba(255,255,255,0.04);backdrop-filter:blur(25px);border:1px solid rgba(255,255,255,0.1);
  border-radius:24px;padding:40px 36px;
  transform:translateY(60px) scale(.9);opacity:0;
  transition:transform .9s cubic-bezier(.22,1,.36,1),opacity .7s;
  box-shadow:0 8px 40px rgba(0,255,255,0.08),0 30px 80px rgba(0,0,0,.7),inset 0 0 40px rgba(0,255,255,.05);}
#login-card.show{transform:translateY(0) scale(1);opacity:1;}

#login-card::before{content:'';position:absolute;top:-1px;left:-1px;
  width:55px;height:55px;border-top:2px solid var(--c);border-left:2px solid var(--c);
  border-radius:18px 0 0 0;box-shadow:-5px -5px 16px rgba(0,85,255,.35);}
#login-card::after{content:'';position:absolute;bottom:-1px;right:-1px;
  width:55px;height:55px;border-bottom:2px solid var(--p);border-right:2px solid var(--p);
  border-radius:0 0 18px 0;box-shadow:5px 5px 16px rgba(187,85,255,.35);}

.scan{position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,rgba(0,85,255,.6),transparent);
  border-radius:18px 18px 0 0;filter:blur(1px);animation:scanDown 5s linear infinite;}
@keyframes scanDown{0%{top:0;opacity:0}5%{opacity:1}95%{opacity:.3}100%{top:100%;opacity:0}}

.card-logo{display:flex;align-items:center;gap:10px;margin-bottom:26px;}
.logo-box{width:38px;height:38px;border-radius:9px;
  background:linear-gradient(135deg,#004488,#0088cc);
  display:flex;align-items:center;justify-content:center;font-size:17px;
  box-shadow:0 0 18px rgba(0,136,204,.45);border:1px solid rgba(0,85,255,.2);}
.logo-name{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;
  color:var(--c);letter-spacing:3px;text-shadow:0 0 12px rgba(0,85,255,.5);}

.card-title{font-family:'Orbitron',monospace;font-size:21px;font-weight:700;
  color:#fff;margin-bottom:5px;text-shadow:0 0 30px rgba(0,85,255,.2);}
.card-sub{font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:300;
  color:rgba(140,160,190,.7);margin-bottom:28px;letter-spacing:.4px;}

.field{margin-bottom:16px;}
.field label{display:block;font-family:'Share Tech Mono',monospace;font-size:10px;
  letter-spacing:2px;color:rgba(0,85,255,.5);text-transform:uppercase;margin-bottom:7px;}
.inp-w{position:relative;}
.inp-w input{width:100%;background:rgba(0,85,255,.025);
  border:1px solid rgba(0,85,255,.1);border-radius:9px;padding:11px 14px 11px 42px;
  color:#d8eaf8;font-family:'Share Tech Mono',monospace;font-size:14px;outline:none;
  transition:border-color .3s,box-shadow .3s,background .3s;}
.inp-w input:focus{border-color:var(--c);background:rgba(0,85,255,.06);
  box-shadow:0 0 0 3px rgba(0,85,255,.1),0 0 20px rgba(0,85,255,.05);}
.inp-w input::placeholder{color:rgba(255,255,255,.14);}
.inp-w input:disabled{opacity:.5;cursor:not-allowed;}
.inp-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);
  width:16px;height:16px;opacity:.4;transition:opacity .3s;}
.inp-w input:focus~.inp-icon{opacity:.9;}

/* Error box */
.login-error{display:flex;align-items:flex-start;gap:8px;
  background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);
  border-radius:9px;padding:10px 12px;margin-bottom:14px;
  color:#fca5a5;font-size:13px;font-family:'Rajdhani',sans-serif;}

.btn-sign{width:100%;padding:13px;margin-top:10px;
  background:linear-gradient(135deg,rgba(0,90,180,.85),rgba(0,50,130,.9));
  border:1px solid rgba(0,85,255,.28);border-radius:9px;
  color:#fff;font-family:'Orbitron',monospace;font-size:11px;font-weight:700;letter-spacing:3px;
  cursor:pointer;position:relative;overflow:hidden;
  transition:transform .2s,box-shadow .3s,border-color .3s;
  box-shadow:0 4px 20px rgba(0,100,200,.3),inset 0 1px 0 rgba(255,255,255,.05);
  display:flex;align-items:center;justify-content:center;gap:8px;}
.btn-sign:hover:not(:disabled){transform:translateY(-2px);
  box-shadow:0 8px 32px rgba(0,85,255,.4);border-color:var(--c);}
.btn-sign:disabled{opacity:.55;cursor:not-allowed;}
.btn-sign::before{content:'';position:absolute;top:0;left:-100%;
  width:55%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);
  transform:skewX(-20deg);animation:btnShimmer 3.5s ease-in-out infinite;}
@keyframes btnShimmer{0%,100%{left:-100%}50%{left:160%}}
@keyframes spin{to{transform:rotate(360deg)}}

.flinks{display:flex;justify-content:space-between;margin-top:16px;}
.flinks a,.flinks button{font-family:'Share Tech Mono',monospace;font-size:11px;
  color:rgba(100,120,150,.7);text-decoration:none;background:none;border:none;cursor:pointer;
  transition:color .2s;letter-spacing:.5px;}
.flinks a:hover,.flinks button:hover{color:var(--c);text-shadow:0 0 8px rgba(0,85,255,.4);}

.meters{margin-top:22px;padding-top:18px;border-top:1px solid rgba(0,85,255,.06);}
.mt-row{display:flex;justify-content:space-between;
  font-family:'Share Tech Mono',monospace;font-size:10px;
  color:rgba(100,120,150,.8);letter-spacing:1px;margin-bottom:5px;}
.mt-val{color:var(--c);}
.mt-track{height:3px;background:rgba(255,255,255,.04);border-radius:2px;overflow:hidden;margin-bottom:10px;}
.mt-fill{height:100%;border-radius:2px;width:0;transition:width 1.5s cubic-bezier(.22,1,.36,1);}
.mf1{background:linear-gradient(90deg,#0044aa,var(--c));box-shadow:0 0 8px rgba(0,85,255,.6);}
.mf2{background:linear-gradient(90deg,#5500aa,var(--p));box-shadow:0 0 8px rgba(187,85,255,.6);}

.status-row{display:flex;align-items:center;gap:7px;
  font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(80,110,140,.8);margin-top:4px;}
.s-dot{width:6px;height:6px;border-radius:50%;background:#00ee55;
  box-shadow:0 0 6px #00ee55;animation:sDotPls 1.5s ease-in-out infinite;}
@keyframes sDotPls{0%,100%{opacity:.5}50%{opacity:1}}

.test-note{margin-top:18px;padding:8px 12px;border-radius:8px;
  background:rgba(0,85,255,.04);border:1px solid rgba(0,85,255,.1);
  font-family:'Share Tech Mono',monospace;font-size:10px;
  color:rgba(100,130,160,.7);text-align:center;letter-spacing:.5px;}
.test-note strong{color:rgba(0,85,255,.7);}

/* Phase text */
#phase-text{position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
  font-family:'Share Tech Mono',monospace;font-size:11px;
  color:rgba(0,85,255,.6);letter-spacing:3px;text-transform:uppercase;
  z-index:100;opacity:0;transition:opacity .5s;text-shadow:0 0 10px rgba(0,85,255,.4);}

/* Skip */
#skip-btn{position:fixed;bottom:20px;right:24px;z-index:200;
  font-family:'Share Tech Mono',monospace;font-size:10px;
  color:rgba(100,120,150,.6);letter-spacing:2px;
  background:none;border:1px solid rgba(100,120,150,.2);
  border-radius:4px;padding:5px 12px;cursor:pointer;transition:color .2s,border-color .2s;}
#skip-btn:hover{color:var(--c);border-color:rgba(0,85,255,.4);}

/* Sparks */
.spark{position:absolute;width:3px;height:3px;border-radius:50%;
  background:var(--c);pointer-events:none;z-index:200;
  animation:sparkFly .8s ease-out forwards;}
@keyframes sparkFly{
  0%{transform:translate(0,0) scale(1);opacity:1;}
  100%{transform:translate(var(--sx),var(--sy)) scale(0);opacity:0;}}

#exp-glow{position:fixed;inset:0;z-index:9;
  background:radial-gradient(ellipse 60% 40% at 50% 50%,rgba(0,85,255,.18),transparent 70%);
  opacity:0;pointer-events:none;transition:opacity .4s;}

/* ═══ RESPONSIVE ═══ */
@media(max-width:520px){
  #gpu-body{width:280px;height:100px;}
  .fan-wrap svg{width:50px;height:50px;}
  .fan-outer{width:62px;height:62px;}
  .fan-housing{width:58px;height:58px;}
  #fan1{right:12px;}#fan2{right:82px;}#fan3{right:152px;}
  #heatsink{left:-28px;}
  .fin{width:26px;}
  #login-card{width:92vw;max-width:360px;padding:28px 22px;}
  #reflect{width:280px;}
  .b-diamond{width:22px;height:22px;}
  .b-text{font-size:10px;letter-spacing:2px;}
}
`;

/* ─── Fan Blade SVG (reusable) ─── */
function FanSVG({ delay, reversed, dotColor }) {
  const angles = [0,60,120,180,240,300];
  const startAngle = reversed ? 30 : 0;
  return (
    <svg width="80" height="80" viewBox="0 0 68 68" fill="none">
      <g className="blade-g" style={delay ? {animationDelay:delay} : undefined}>
        {angles.map((a,i) => (
          <ellipse key={i} cx="34" cy="17" rx="7.5" ry="16"
            fill={i%2===0?'#181c2a':'#1d2232'}
            transform={`rotate(${startAngle+a} 34 34)`} />
        ))}
      </g>
      <circle cx="34" cy="34" r="9" className="fan-center"/>
      <circle cx="34" cy="34" r="5" fill="#1a1e2c"/>
      <circle cx="34" cy="34" r="2.5" fill={dotColor||'var(--c)'} opacity=".7"/>
    </svg>
  );
}

/* ─── Dust particles (memoised) ─── */
function useDust(count) {
  return useMemo(() =>
    Array.from({length:count},(_,i)=>{
      const sz = Math.random()*2.5+1;
      return {
        id:i, size:sz,
        left:`${Math.random()*100}vw`,
        color: Math.random()>.5 ? '#00d4ff':'#bb55ff',
        duration:`${9+Math.random()*14}s`,
        delay:`${Math.random()*14}s`,
        opacity: .3+Math.random()*.4,
      };
    }), [count]);
}

/* ═══════════════════════════════ */
/*         MAIN COMPONENT         */
/* ═══════════════════════════════ */
function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [formData, setFormData] = useState({ email:"", password:"" });
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  // Refs for imperative DOM animation
  const rootRef = useRef(null);
  const sparksRef = useRef([]);

  // Animation phase state
  const [phaseText, setPhaseText] = useState("");
  const [phaseVisible, setPhaseVisible] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [loginCardShow, setLoginCardShow] = useState(false);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [meterWidths, setMeterWidths] = useState(["0","0"]);
  const [skipHidden, setSkipHidden] = useState(false);

  const dust = useDust(35);

  // ─── Helpers ───
  const wait = (ms) => new Promise(r => setTimeout(r,ms));
  const $ = useCallback((sel) => rootRef.current?.querySelector(sel), []);
  const $$ = useCallback((sel) => rootRef.current?.querySelectorAll(sel), []);

  const showPhase = useCallback((txt) => { setPhaseText(txt); setPhaseVisible(true); }, []);
  const hidePhase = useCallback(() => setPhaseVisible(false), []);

  const emitSparks = useCallback((el, count=18) => {
    if(!el||!rootRef.current) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const frags = [];
    for(let i=0;i<count;i++){
      const angle = Math.random()*Math.PI*2;
      const dist = 60+Math.random()*120;
      const sp = document.createElement('div');
      sp.className='spark';
      sp.style.cssText=`left:${cx}px;top:${cy}px;--sx:${Math.cos(angle)*dist}px;--sy:${Math.sin(angle)*dist}px;background:${Math.random()>.5?'#00d4ff':'#bb55ff'};animation-duration:${.5+Math.random()*.5}s;`;
      rootRef.current.appendChild(sp);
      frags.push(sp);
    }
    setTimeout(()=>frags.forEach(s=>s.remove()),900);
  },[]);

  // ─── Show login immediately (skip) ───
  const showLoginNow = useCallback(() => {
    // Power everything on
    $$('.blade-g')?.forEach(b=>{b.style.animationPlayState='running';});
    $$('.fan-ring-glow')?.forEach(r=>{r.style.opacity='1';});
    $$('.fan-ring-glow-outer')?.forEach(r=>{r.style.opacity='1';});
    const rb=$('#rgb-bar'); if(rb) rb.style.opacity='1';
    const rs=$('#rgb-side'); if(rs) rs.style.opacity='1';
    $$('.fin')?.forEach(f=>f.classList.add('fin-on'));
    const ml=$('#model-label'); if(ml) ml.style.opacity='1';
    const tg=$('#table-glow'); if(tg) tg.style.opacity='1';
    const sh=$('#shadow-el'); if(sh) sh.style.opacity='1';
    const rf=$('#reflect'); if(rf) rf.style.opacity='1';

    // Shrink GPU
    const gc=$('#gpu-container');
    if(gc){
      gc.style.transition='transform .8s, opacity .8s';
      gc.style.transform='rotateX(22deg) rotateY(-28deg) scale(.72) translateX(-160px) translateY(20px)';
      gc.style.opacity='0.35';
    }

    // Show login
    setLoginVisible(true);
    setBackdropVisible(true);
    setTimeout(()=>setLoginCardShow(true),200);
    setTimeout(()=>setMeterWidths(["72%","48%"]),600);
    hidePhase();
    setSkipHidden(true);
  },[$,$$,hidePhase]);

  // ─── Full animation sequence ───
  useEffect(() => {
    let cancelled = false;
    async function run(){
      try {
        const gpuBody = $('#gpu-body');
        const gpuCont = $('#gpu-container');
        const fan1=$('#fan1'), fan2=$('#fan2'), fan3=$('#fan3');
        const heatsink=$('#heatsink');
        const panelTop=$('#panel-top'), panelBot=$('#panel-bottom');
        const blades=$$('.blade-g');
        const ringGlows=$$('.fan-ring-glow');
        const ringOuter=$$('.fan-ring-glow-outer');
        const rgbBar=$('#rgb-bar'), rgbSide=$('#rgb-side');
        const modelLabel=$('#model-label');
        const tableGlow=$('#table-glow');
        const shadowEl=$('#shadow-el'), reflectEl=$('#reflect');
        const expGlow=$('#exp-glow');
        const fins=$$('.fin');

        // Phase 1: GPU drops (CSS animation), wait
        showPhase('INITIALIZING HARDWARE...');
        await wait(1000);
        if(cancelled) return;

        if(tableGlow) tableGlow.style.opacity='1';
        if(shadowEl) shadowEl.style.opacity='1';
        if(reflectEl) reflectEl.style.opacity='1';
        await wait(400);
        if(cancelled) return;

        // Phase 2: power-on surge
        showPhase('POWER SEQUENCE INITIATED');
        if(expGlow) expGlow.style.opacity='1';
        emitSparks(gpuBody,8);
        await wait(200);
        if(cancelled) return;
        if(expGlow) expGlow.style.opacity='0';
        await wait(600);
        if(cancelled) return;

        // Phase 3: Components fly apart
        showPhase('DEPLOYING COMPONENTS...');
        if(fan1){fan1.style.transition='transform 1s cubic-bezier(.22,1,.36,1), opacity .4s';fan1.style.transform='translateY(-50%) translateX(140px) translateZ(60px)';}
        if(fan2){fan2.style.transition='transform 1s cubic-bezier(.22,1,.36,1) .08s, opacity .4s';fan2.style.transform='translateY(-50%) translateX(0px) translateZ(80px)';}
        if(fan3){fan3.style.transition='transform 1s cubic-bezier(.22,1,.36,1) .16s, opacity .4s';fan3.style.transform='translateY(-50%) translateX(-140px) translateZ(60px)';}
        if(panelTop) panelTop.style.transform='rotateX(-55deg) translateZ(8px)';
        if(panelBot) panelBot.style.transform='rotateX(55deg) translateZ(8px)';
        if(heatsink) heatsink.style.transform='translateX(-60px) translateZ(30px)';
        emitSparks(gpuBody,22);
        await wait(400);
        if(cancelled) return;
        if(expGlow) expGlow.style.opacity='.6';
        await wait(200);
        if(cancelled) return;
        if(expGlow) expGlow.style.opacity='0';
        await wait(900);
        if(cancelled) return;

        // Phase 4: Fans spin, RGB glow
        showPhase('SPINNING UP COOLING ARRAY...');
        blades?.forEach(b=>{b.style.animationPlayState='running';});
        ringGlows?.forEach(r=>{r.style.opacity='1';});
        ringOuter?.forEach(r=>{r.style.opacity='1';});
        if(rgbBar) rgbBar.style.opacity='1';
        if(rgbSide) rgbSide.style.opacity='1';
        fins?.forEach(f=>f.classList.add('fin-on'));
        if(modelLabel) modelLabel.style.opacity='1';
        await wait(1000);
        if(cancelled) return;

        // Phase 5: snap back
        showPhase('ASSEMBLY COMPLETE');
        if(fan1) fan1.style.transform='translateY(-50%) translateX(0) translateZ(0)';
        if(fan2) fan2.style.transform='translateY(-50%) translateX(0) translateZ(0)';
        if(fan3) fan3.style.transform='translateY(-50%) translateX(0) translateZ(0)';
        if(panelTop) panelTop.style.transform='rotateX(0) translateZ(0)';
        if(panelBot) panelBot.style.transform='rotateX(0) translateZ(0)';
        if(heatsink) heatsink.style.transform='translateX(0) translateZ(0)';
        await wait(1200);
        if(cancelled) return;

        // Phase 6: GPU shrinks, login appears
        showPhase('ACCESS TERMINAL READY');
        if(gpuCont){
          gpuCont.style.transition='transform 1.2s cubic-bezier(.22,1,.36,1), opacity 1s';
          gpuCont.style.transform='rotateX(22deg) rotateY(-28deg) scale(.72) translateX(-160px) translateY(20px)';
          gpuCont.style.opacity='0.35';
        }
        await wait(500);
        if(cancelled) return;

        setLoginVisible(true);
        setBackdropVisible(true);
        await wait(200);
        if(cancelled) return;
        setLoginCardShow(true);
        await wait(800);
        if(cancelled) return;
        hidePhase();
        setSkipHidden(true);
        setTimeout(()=>setMeterWidths(["72%","48%"]),300);

      } catch(e){
        // Fallback: show login immediately
        if(!cancelled) showLoginNow();
      }
    }
    run();
    return ()=>{ cancelled=true; };
  },[showPhase,hidePhase,$,$$,emitSparks,showLoginNow]);

  // ─── Auth handlers ───
  const validateEmail = (email) => /^[^\s@]+@thapar\.edu$/i.test(email);

  const handleInputChange = (e) => {
    const {name,value} = e.target;
    setFormData(prev=>({...prev,[name]:value}));
    if(validationError) setValidationError("");
    if(error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setValidationError("");
    if(!formData.email){ setValidationError("Email address is required."); return; }
    if(!validateEmail(formData.email)){ setValidationError("Only @thapar.edu email addresses are allowed."); return; }
    if(!formData.password){ setValidationError("Password is required."); return; }
    const result = await login(formData.email,formData.password);
    if(result.success) navigate("/dashboard");
    else setError(result.error || "Login failed. Please try again.");
  };

  const displayError = validationError || error;

  return (
    <div className="gpu-page" ref={rootRef}>
      <style>{CSS}</style>

      {/* ═══ Environment ═══ */}
      <div id="env"/>
      <div className="wline wl"/>
      <div className="wline wr"/>
      <div className="wline wt"/>
      <div id="floor"/>
      <div id="table-glow"/>
      <div id="exp-glow"/>

      {/* Dust */}
      <div style={{position:'fixed',inset:0,zIndex:1,pointerEvents:'none'}}>
        {dust.map(d=>(
          <div key={d.id} className="dp" style={{
            left:d.left, width:d.size, height:d.size,
            background:d.color,
            animationDuration:d.duration, animationDelay:d.delay,
            opacity:d.opacity,
          }}/>
        ))}
      </div>

      {/* Phase label */}
      <div id="phase-text" style={{opacity:phaseVisible?1:0}}>{phaseText}</div>

      {/* Skip button */}
      {!skipHidden && (
        <button id="skip-btn" onClick={showLoginNow}>SKIP INTRO ▶</button>
      )}

      {/* ═══ GPU STAGE ═══ */}
      <div id="stage">
        <div id="gpu-world">
          <div id="gpu-container">
            <div id="shadow-el"/>
            <div id="reflect"/>

            <div id="gpu-body">
              <div id="panel-top"/>
              <div id="panel-bottom"/>
              <div id="rgb-bar"/>
              <div id="rgb-side"/>
              <div id="model-label">RTX 5090 · 32GB GDDR7X · CAMPUSCLOUD</div>

              {/* PCB traces */}
              <div className="pcb" style={{top:12,left:110,width:50,height:1}}/>
              <div className="pcb" style={{top:16,left:110,width:24,height:1}}/>
              <div className="pcb" style={{top:12,left:110,width:1,height:28}}/>

              {/* Brand */}
              <div id="brand-panel">
                <div className="b-diamond"/>
                <div className="b-text">CC</div>
              </div>

              {/* Screws */}
              <div className="screw" style={{top:8,left:90}}/>
              <div className="screw" style={{top:8,right:8}}/>
              <div className="screw" style={{bottom:8,left:90}}/>
              <div className="screw" style={{bottom:8,right:8}}/>

              {/* Fan 1 */}
              <div className="fan-wrap" id="fan1">
                <div className="fan-outer">
                  <div className="fan-ring-glow"/>
                  <div className="fan-ring-glow-outer"/>
                  <div className="fan-housing">
                    <FanSVG />
                  </div>
                </div>
              </div>

              {/* Fan 2 */}
              <div className="fan-wrap" id="fan2">
                <div className="fan-outer">
                  <div className="fan-ring-glow" style={{
                    background:'conic-gradient(var(--p) 0deg,transparent 100deg,var(--c) 200deg,transparent 300deg,var(--p) 360deg)',
                    animationDirection:'reverse',animationDuration:'2.4s'}}/>
                  <div className="fan-ring-glow-outer" style={{
                    boxShadow:'0 0 14px 3px rgba(187,85,255,.5),0 0 30px 8px rgba(187,85,255,.15)'}}/>
                  <div className="fan-housing">
                    <FanSVG delay="-.22s" reversed dotColor="var(--p)"/>
                  </div>
                </div>
              </div>

              {/* Fan 3 */}
              <div className="fan-wrap" id="fan3">
                <div className="fan-outer">
                  <div className="fan-ring-glow"/>
                  <div className="fan-ring-glow-outer"/>
                  <div className="fan-housing">
                    <FanSVG delay="-.44s"/>
                  </div>
                </div>
              </div>
            </div>

            {/* Heatsink */}
            <div id="heatsink">
              {Array.from({length:10}).map((_,i)=><div key={i} className="fin"/>)}
            </div>

            {/* IO */}
            <div id="io">
              {[0,1,2,3].map(i=><div key={i} className="io-port"/>)}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LOGIN OVERLAY ═══ */}
      <div id="login-overlay" className={loginVisible?'visible':''}>
        <div id="login-backdrop" style={{opacity:backdropVisible?1:0}}/>
        <div id="login-card" className={loginCardShow?'show':''}>
          <div className="scan"/>

          {/* Logo */}
          <div className="card-logo">
            <div className="logo-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="13" rx="2"/>
                <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
                <circle cx="12" cy="13.5" r="1.8"/>
                <path d="M7.5 13.5h2.7M13.8 13.5h2.7"/>
              </svg>
            </div>
            <div className="logo-name">CAMPUSCLOUD</div>
          </div>

          <div className="card-title">Welcome Back</div>
          <div className="card-sub">Sign in to access your GPU cluster</div>

          {/* Error */}
          {displayError && (
            <div className="login-error">
              <AlertCircle style={{width:16,height:16,flexShrink:0,marginTop:1}}/>
              <span>{displayError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Thapar Email</label>
              <div className="inp-w">
                <input type="email" name="email" value={formData.email}
                  onChange={handleInputChange} placeholder="user@thapar.edu"
                  disabled={isLoading} autoComplete="email"/>
                <svg className="inp-icon" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="6" r="3" stroke="#00d4ff" strokeWidth="1.5"/>
                  <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="field">
              <label>Password</label>
              <div className="inp-w">
                <input type="password" name="password" value={formData.password}
                  onChange={handleInputChange} placeholder="••••••••"
                  disabled={isLoading} autoComplete="current-password"/>
                <svg className="inp-icon" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="2" stroke="#00d4ff" strokeWidth="1.5"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <button type="submit" className="btn-sign" disabled={isLoading}>
              {isLoading
                ? <><Loader style={{width:16,height:16,animation:'spin 1s linear infinite'}}/> <span>AUTHENTICATING...</span></>
                : 'INITIALIZE SESSION'
              }
            </button>
          </form>

          <div className="flinks">
            <button type="button">Forgot password?</button>
            <button type="button">Create account</button>
          </div>

          {/* Meters */}
          <div className="meters">
            <div className="mt-row"><span>GPU-0 · RTX 5090</span><span className="mt-val">72%</span></div>
            <div className="mt-track"><div className="mt-fill mf1" style={{width:meterWidths[0]}}/></div>
            <div className="mt-row"><span>GPU-1 · H100 SXM</span><span className="mt-val">48%</span></div>
            <div className="mt-track"><div className="mt-fill mf2" style={{width:meterWidths[1]}}/></div>
            <div className="status-row">
              <div className="s-dot"/>
              <span>CLUSTER ONLINE · 2 NODES ACTIVE</span>
            </div>
          </div>

          <div className="test-note">
            <strong>Demo:</strong> test@thapar.edu / 123456
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
