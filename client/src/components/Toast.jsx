import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ─── Context ────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = 'error', duration = 4500) => {
    if (!message) return;
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleShowToast = (e) => {
      const { message, type = 'error', duration = 4500 } = e.detail || {};
      addToast(message, type, duration);
    };
    window.addEventListener('show-toast', handleShowToast);
    return () => {
      window.removeEventListener('show-toast', handleShowToast);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.addToast;
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const ICONS = {
  error:   '✕',
  success: '✓',
  info:    'ℹ',
  warning: '⚠',
};

const STYLES = {
  error: {
    bg: 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%)',
    border: 'rgba(239,68,68,0.45)',
    icon: '#fca5a5',
    iconBg: 'rgba(239,68,68,0.2)',
    bar: '#ef4444',
  },
  success: {
    bg: 'linear-gradient(135deg,#14532d 0%,#166534 100%)',
    border: 'rgba(34,197,94,0.4)',
    icon: '#86efac',
    iconBg: 'rgba(34,197,94,0.2)',
    bar: '#22c55e',
  },
  info: {
    bg: 'linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)',
    border: 'rgba(59,130,246,0.4)',
    icon: '#93c5fd',
    iconBg: 'rgba(59,130,246,0.2)',
    bar: '#3b82f6',
  },
  warning: {
    bg: 'linear-gradient(135deg,#78350f 0%,#92400e 100%)',
    border: 'rgba(245,158,11,0.4)',
    icon: '#fde68a',
    iconBg: 'rgba(245,158,11,0.2)',
    bar: '#f59e0b',
  },
};

// ─── Individual Toast ────────────────────────────────────────────────────────
function Toast({ id, message, type, onDismiss }) {
  const s = STYLES[type] || STYLES.error;
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: '12px',
        padding: '14px 16px 14px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        maxWidth: '400px',
        width: '100%',
        overflow: 'hidden',
        animation: 'toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Coloured left bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '4px', background: s.bar, borderRadius: '12px 0 0 12px',
      }} />

      {/* Icon */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: s.iconBg, color: s.icon,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: '700', flexShrink: 0,
      }}>
        {ICONS[type]}
      </div>

      {/* Message */}
      <p style={{
        flex: 1, margin: 0, fontSize: '13.5px', fontWeight: '500',
        color: '#f8fafc', lineHeight: 1.5, whiteSpace: 'pre-line',
        paddingTop: '2px',
      }}>
        {message}
      </p>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(248,250,252,0.5)', fontSize: '16px', padding: '2px 4px',
          lineHeight: 1, flexShrink: 0, transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#f8fafc'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,250,252,0.5)'}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

// ─── Container ───────────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(40px) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <Toast {...t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
