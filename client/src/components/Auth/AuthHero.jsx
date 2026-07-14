import { ArrowRight, Activity } from 'lucide-react';

export default function AuthHero({ onSignInClick, onHowItWorksClick }) {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-text">
          <div className="hero-badge">Safety Education Platform</div>
          <h1>Making Campus Disaster Preparedness Safe, Smart, and Gamified</h1>
          <p>
            Transforming traditional safety blueprints into interactive learning experiences. Evaquate lets school administrators, instructors, and students connect on a single portal to master critical emergency training together.
          </p>
          <div className="hero-cta-group">
            <button className="nav-btn" style={{ padding: '14px 32px', borderRadius: '8px', fontSize: '15px' }} onClick={onSignInClick}>
              Enter Dashboard <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={onHowItWorksClick}>How It Works</button>
          </div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid #e7e5e4', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px -15px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f5f4f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700 }}>
              <Activity size={16} color="#1d4ed8" /> Active Simulation Modules
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#fdfbf7', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#78716c' }}>Supported Scenarios</span>
              <strong style={{ fontSize: '13px' }}>Fire, Flood, Earthquake, Landslide</strong>
            </div>
            <div style={{ background: '#fdfbf7', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#78716c' }}>Assessment Layer</span>
              <strong style={{ fontSize: '13px' }}>Built-in Evacuation Drills &amp; Quizzes</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
