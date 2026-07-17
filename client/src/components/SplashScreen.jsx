import React, { useEffect, useState } from 'react';
import logoImg from '../assets/logo_3.png';

/**
 * SplashScreen
 *
 * Props:
 *   message   {string}   — small status line at the bottom
 *   mini      {boolean}  — compact inline spinner variant
 *   simple    {boolean}  — short fade-in/out lockup (post-login, no cinematic sequence)
 *   autoExit  {number}   — ms until onDone fires (0 = never)
 *   onDone    {function} — called after exit animation ends
 */
export default function SplashScreen({
  message  = 'Loading',
  mini     = false,
  simple   = false,
  autoExit = 0,
  onDone,
}) {
  // 'enter' | 'closing' | 'exit'
  const [phase, setPhase] = useState('enter');
  const [dots,  setDots]  = useState('');

  // Derive these early — used by all render paths
  const isClosing = phase === 'closing' || phase === 'exit';
  const isExit    = phase === 'exit';

  /* animated ellipsis */
  useEffect(() => {
    const id = setInterval(
      () => setDots(d => (d.length >= 3 ? '' : d + '.')),
      500,
    );
    return () => clearInterval(id);
  }, []);

  /* phase transitions */
  useEffect(() => {
    if (!autoExit) return;
    // closing starts 2350ms before autoExit:
    //   step 1 — status/text/logo-slide: 0.65s
    //   step 2 — logo rises: 1.1s (starts at 0.65s)
    //   step 3 — overlay exit fade: 0.6s (starts at 1.75s)
    //   total close: 2.35s
    //
    // onDone fires 200ms BEFORE the exit fade ends so the next page
    // renders behind the still-visible overlay — eliminates blank gap.
    const closingAt = Math.max(autoExit - 2350, 100);
    const exitAt    = Math.max(autoExit - 600,  150);
    const doneAt    = Math.max(autoExit - 200,  200); // early — overlap with fade

    const t1 = setTimeout(() => setPhase('closing'), closingAt);
    const t2 = setTimeout(() => setPhase('exit'),    exitAt);
    const t3 = setTimeout(() => onDone?.(),          doneAt);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [autoExit, onDone]);

  /* ── mini inline variant ─────────────────────────────── */
  if (mini) {
    return (
      <div style={s.miniWrap}>
        <img src={logoImg} alt="EVAQUATE" style={s.miniLogo} />
        <span style={s.miniText}>{message}{dots}</span>
      </div>
    );
  }

  /* ── simple post-login variant (fast fade, no cinematic) ── */
  if (simple) {
    return (
      <>
        <style>{SIMPLE_CSS}</style>
        <div className={`evq-simple${isExit ? ' evq-simple--exit' : ''}`}>
          <div className="evq-simple-lockup">
            <img src={logoImg} alt="" className="evq-simple-logo" draggable={false} />
            <span className="evq-simple-brand">EVAQUATE</span>
          </div>
          <p className="evq-simple-msg">{message}{dots}</p>
        </div>
      </>
    );
  }

  /* ── full cinematic splash ───────────────────────────── */
  return (
    <>
      <style>{CSS}</style>

      <div
        className={`evq-overlay${isExit ? ' evq-exit' : ''}`}
        role="status"
        aria-label="Loading EVAQUATE"
      >
        {/* ambient blobs */}
        <div className="evq-blob evq-blob-tl"  />
        <div className="evq-blob evq-blob-br"  />
        <div className="evq-blob evq-blob-mid" />

        {/*
          Two-wrapper trick — eliminates animation-chaining glitch:
            evq-drop-wrap  → ONLY handles the vertical drop
            evq-logo-wrap  → ONLY handles the horizontal slide
          Each wrapper owns one transform axis, so they never conflict.
        */}
        <div className={`evq-stage${isClosing ? ' evq-stage--closing' : ''}`}>

          {/* outer: vertical drop only */}
          <div className={`evq-drop-wrap${isClosing ? ' evq-drop-wrap--rise' : ''}`}>

            {/* inner: horizontal slide only */}
            <div className={`evq-logo-wrap${isClosing ? ' evq-logo-wrap--back' : ''}`}>
              <img
                src={logoImg}
                alt=""
                className="evq-logo"
                draggable={false}
              />
            </div>

          </div>

          {/* TEXT — expands out rightward from logo edge */}
          <div className={`evq-text-wrap${isClosing ? ' evq-text-wrap--collapse' : ''}`}>
            <div className="evq-brand" aria-label="EVAQUATE">
              {'EVAQUATE'.split('').map((ch, i) => (
                <span
                  key={i}
                  className="evq-letter"
                  style={{ animationDelay: `${1.4 + i * 0.085}s` }}
                >
                  {ch}
                </span>
              ))}
            </div>
            <p className="evq-tagline">
              Smart Emergency Training for Schools
            </p>
          </div>

        </div>

        {/* Status text */}
        <div className={`evq-status-wrap${isClosing ? ' evq-status-wrap--hide' : ''}`}>
          <p className="evq-status">{message}{dots}</p>
        </div>

      </div>
    </>
  );
}

/* ─── mini styles ─────────────────────────────────────────── */
const s = {
  miniWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '10px', padding: '32px 16px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  miniLogo: { width: '22px', height: '22px', objectFit: 'contain', opacity: 0.65 },
  miniText: { color: '#64748b', fontSize: '14px' },
};

/* ─── simple variant CSS ──────────────────────────────────── */
const SIMPLE_CSS = `
  .evq-simple {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: linear-gradient(150deg,
      #060b16 0%, #0b1628 40%, #091422 70%, #0e1c33 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    animation: evqs-in 0.35s ease both;
  }
  .evq-simple--exit {
    animation: evqs-out 0.35s ease both !important;
  }
  .evq-simple-lockup {
    display: flex;
    align-items: center;
    gap: 18px;
    animation: evqs-up 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both;
  }
  .evq-simple-logo {
    width: 52px; height: 52px;
    object-fit: contain;
    border-radius: 14px;
    background: rgba(255,255,255,0.055);
    padding: 7px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.07),
      0 0 22px rgba(82,130,255,0.4),
      0 6px 24px rgba(0,0,0,0.5);
  }
  .evq-simple-brand {
    font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    font-size: clamp(24px, 3.5vw, 34px);
    font-weight: 800;
    letter-spacing: 5px;
    background: linear-gradient(158deg, #ffffff 20%, #8fb4d8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .evq-simple-msg {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    color: #2a4260;
    letter-spacing: 0.5px;
    margin: 0;
    animation: evqs-up 0.4s ease 0.35s both;
  }
  @keyframes evqs-in  { from { opacity:0 } to { opacity:1 } }
  @keyframes evqs-out { from { opacity:1 } to { opacity:0 } }
  @keyframes evqs-up  {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0);    }
  }
`;

/* ═══════════════════════════════════════════════════════════════════
   CSS
   ───────────────────────────────────────────────────────────────────
   TIMELINE  (autoExit 3200ms)
   ───────────────────────────────────────────────────────────────────
   0.00s   overlay fades in
   0.10s   logo begins drop  (0.68s spring)
   0.78s   logo lands at centre — bounce settles
   0.90s   logo begins slide left  (0.45s)   ← separate wrapper, no conflict
   0.90s   text expands rightward  (0.45s)
   0.85s   first letter pops in (staggered 55ms → last ~1.30s)
   1.35s   tagline fades up
   1.50s   status text fades up
   ── dwell ──
   2.50s   closing: text collapses (0.30s), logo slides back (0.30s)
   2.90s   exit fade+scale (0.40s)
   3.20s   onDone()
═══════════════════════════════════════════════════════════════════ */
const CSS = `

/* ── overlay ──────────────────────────────────────────────── */
.evq-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  background: linear-gradient(150deg,
    #060b16 0%, #0b1628 40%, #091422 70%, #0e1c33 100%);
  animation: evqOverlayIn 0.28s ease both;
}
.evq-exit {
  animation: evqOverlayOut 0.6s cubic-bezier(0.55,0,1,0.45) both !important;
  pointer-events: none;
}

/* ── ambient blobs ────────────────────────────────────────── */
.evq-blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  animation: evqBlobIn 1.2s ease 0.2s forwards;
}
.evq-blob-tl {
  width: 560px; height: 560px; top: -140px; left: -120px;
  background: radial-gradient(circle, rgba(49,90,210,0.15) 0%, transparent 68%);
  filter: blur(80px);
}
.evq-blob-br {
  width: 600px; height: 600px; bottom: -160px; right: -120px;
  background: radial-gradient(circle, rgba(14,165,233,0.11) 0%, transparent 68%);
  filter: blur(90px);
  animation-delay: 0.35s;
}
.evq-blob-mid {
  width: 720px; height: 720px; top: 50%; left: 50%;
  translate: -50% -50%;
  background: radial-gradient(circle, rgba(82,97,230,0.06) 0%, transparent 62%);
  filter: blur(100px);
  animation-delay: 0.55s;
}

/* ── stage (centres the lockup) ──────────────────────────── */
.evq-stage {
  position: absolute;
  top: 50%; left: 50%;
  translate: -50% -50%;
  display: flex;
  flex-direction: row;
  align-items: center;
}

/* ── drop wrapper — ONLY translateY ──────────────────────── */
.evq-drop-wrap {
  flex-shrink: 0;
  /* drop from above viewport centre, spring bounce */
  animation: evqDrop 1.1s cubic-bezier(0.18,1.45,0.38,1.00) 0.15s both;
}
/* reverse: rise back up after slide returns to centre */
.evq-drop-wrap--rise {
  animation: evqRise 1.1s cubic-bezier(0.65,0.00,0.35,1.00) 0.65s both !important;
}

/* ── logo wrapper — ONLY translateX (slide) ──────────────── */
.evq-logo-wrap {
  width: 88px; height: 88px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
  z-index: 2;
  /* slide left after landing */
  animation: evqSlideLeft 0.65s cubic-bezier(0.65,0.00,0.35,1.00) 1.30s both;
}
/* reverse: slide back to centre */
.evq-logo-wrap--back {
  animation: evqSlideBack 0.65s cubic-bezier(0.65,0.00,0.35,1.00) 0s both !important;
}

/* logo image */
.evq-logo {
  width: 76px; height: 76px;
  object-fit: contain;
  border-radius: 20px;
  background: rgba(255,255,255,0.055);
  padding: 10px;
  user-select: none; pointer-events: none;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.07),
    0 0 28px rgba(82,130,255,0.38),
    0 0 64px rgba(82,130,255,0.16),
    0 10px 36px rgba(0,0,0,0.55);
  animation: evqGlow 3s ease-in-out 0.9s infinite alternate;
}

/* ── text wrapper ─────────────────────────────────────────── */
.evq-text-wrap {
  display: flex; flex-direction: column;
  justify-content: center; align-items: flex-start;
  overflow: hidden;
  padding-left: 16px;
  gap: 7px;
  /* enter: expand out from zero width */
  max-width: 0; opacity: 0;
  animation: evqTextExpand 0.65s cubic-bezier(0.65,0.00,0.35,1.00) 1.30s forwards;
}
/* closing: collapse back to zero width */
.evq-text-wrap--collapse {
  animation: evqTextCollapse 0.65s cubic-bezier(0.65,0.00,0.35,1.00) 0s forwards !important;
}

/* brand */
.evq-brand {
  display: flex; align-items: baseline;
  white-space: nowrap; line-height: 1;
}
.evq-letter {
  display: inline-block;
  font-family: 'Outfit', 'Inter', system-ui, sans-serif;
  font-size: clamp(28px, 4.2vw, 44px);
  font-weight: 800;
  letter-spacing: 4px;
  background: linear-gradient(158deg, #ffffff 20%, #8fb4d8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  transform: translateY(8px);
  animation: evqLetterPop 0.45s cubic-bezier(0.22,1.3,0.36,1) forwards;
}

/* tagline */
.evq-tagline {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(8px, 1.1vw, 10.5px);
  font-weight: 500;
  color: #375070;
  letter-spacing: 2.2px;
  text-transform: uppercase;
  margin: 0; white-space: nowrap;
  opacity: 0;
  animation: evqFadeUp 0.55s ease 2.2s forwards;
}

/* ── status text ──────────────────────────────────────────── */
.evq-status-wrap {
  position: absolute;
  bottom: 52px; left: 50%; translate: -50% 0;
  opacity: 0;
  animation: evqFadeUp 0.38s ease 1.52s forwards;
}
.evq-status-wrap--hide {
  animation: evqFadeDown 0.55s ease 0s forwards !important;
}
.evq-status {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 10.5px;
  color: #2a4260;
  letter-spacing: 0.5px;
  margin: 0; text-align: center; white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════
   KEYFRAMES
═══════════════════════════════════════════════════════════ */

@keyframes evqOverlayIn  { from { opacity:0 } to { opacity:1 } }
@keyframes evqOverlayOut {
  from { opacity:1; transform:scale(1);    }
  to   { opacity:0; transform:scale(1.04); }
}
@keyframes evqBlobIn { to { opacity:1 } }

/* vertical drop — spring bounce */
@keyframes evqDrop {
  0%   { opacity:0; transform:translateY(-150px); }
  6%   { opacity:1; }
  100% { opacity:1; transform:translateY(0);      }
}
/* vertical rise — mirror of drop, exits upward */
@keyframes evqRise {
  0%   { opacity:1; transform:translateY(0);       }
  94%  { opacity:1; }
  100% { opacity:0; transform:translateY(-150px);  }
}

/* slide left (open) */
@keyframes evqSlideLeft {
  from { transform:translateX(0);     }
  to   { transform:translateX(-68px); }
}
/* slide back to centre (close) */
@keyframes evqSlideBack {
  from { transform:translateX(-68px); }
  to   { transform:translateX(0);     }
}

/* text expand (open) */
@keyframes evqTextExpand {
  from { max-width:0;     opacity:0; }
  18%  { opacity:1; }
  to   { max-width:380px; opacity:1; }
}
/* text collapse (close) */
@keyframes evqTextCollapse {
  from { max-width:380px; opacity:1; }
  80%  { opacity:0; }
  to   { max-width:0;     opacity:0; }
}

/* logo glow breathe */
@keyframes evqGlow {
  from {
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.07),
      0 0 28px rgba(82,130,255,0.38),
      0 0 64px rgba(82,130,255,0.16),
      0 10px 36px rgba(0,0,0,0.55);
  }
  to {
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.09),
      0 0 44px rgba(82,130,255,0.56),
      0 0 90px rgba(82,130,255,0.24),
      0 10px 36px rgba(0,0,0,0.55);
  }
}

/* letters */
@keyframes evqLetterPop {
  to { opacity:1; transform:translateY(0); }
}

/* shared fade helpers */
@keyframes evqFadeUp {
  from { opacity:0; transform:translateY(7px); }
  to   { opacity:1; transform:translateY(0);   }
}
@keyframes evqFadeDown {
  from { opacity:1; }
  to   { opacity:0; }
}

/* ── mobile ────────────────────────────────────────────────── */
@media (max-width: 520px) {
  .evq-logo-wrap    { width:72px; height:72px; }
  .evq-logo         { width:62px; height:62px; border-radius:16px; }
  .evq-status-wrap  { bottom:36px; }
  @keyframes evqSlideLeft {
    from { transform:translateX(0);     }
    to   { transform:translateX(-52px); }
  }
  @keyframes evqSlideBack {
    from { transform:translateX(-52px); }
    to   { transform:translateX(0);     }
  }
}
`;
