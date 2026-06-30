import React, { useState, useRef } from 'react';
import { Shield, AlertCircle, KeyRound, User, Eye, EyeOff, Lock, Globe, LogIn, ArrowRight, Activity, BookOpen, Layers, Sparkles } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  // Modal & Layout States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Smooth Scroll Anchor
  const howItWorksRef = useRef(null);

  const scrollToSection = (elementRef) => {
    if (elementRef && elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (data.success) {
        setIsModalOpen(false);
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Sign in failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the server. Please verify your connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      /* Partial mesh gradient background blending cream, soft amber, and light blue */
      backgroundImage: 'radial-gradient(at 0% 0%, #fdfbf7 0px, transparent 50%), radial-gradient(at 100% 0%, #fef3c7 0px, transparent 50%), radial-gradient(at 100% 100%, #eff6ff 0px, transparent 50%), radial-gradient(at 0% 100%, #fdfbf7 0px, transparent 50%)',
      backgroundColor: '#fbf9f4',
      color: '#0f172a',
      position: 'relative'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        /* ── Navigation Header ── */
        .nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 60px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e1dbd6;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 20px;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .nav-btn {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.15s, transform 0.1s;
        }
        .nav-btn:hover { opacity: 0.95; }

        /* ── Main Hero Area ── */
        .hero-section {
          position: relative;
          overflow: hidden;
        }
        .hero-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 100px 60px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 80px;
          align-items: center;
        }
        .hero-text h1 {
          font-size: 44px;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 24px 0;
          letter-spacing: -1px;
          color: #1c1917;
        }
        .hero-text p {
          font-size: 16px;
          color: #57534e;
          line-height: 1.7;
          margin: 0 0 40px 0;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #ffffff 0%, #f5f4f0 100%);
          border: 1px solid #e7e5e4;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          color: #78716c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        
        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(4px);
          border: 1px solid #d6d3d1;
          color: #44403c;
          padding: 14px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-secondary:hover {
          background: #ffffff;
          border-color: #a8a29e;
        }

        /* ── Core Features Layout ── */
        .functional-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 100px 60px;
        }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-title { font-size: 32px; font-weight: 800; color: #1c1917; margin: 0 0 12px 0; letter-spacing: -0.5px; }
        .section-subtitle { font-size: 15px; color: #78716c; margin: 0; }
        
        .functional-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .functional-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid #e7e5e4;
          border-radius: 12px;
          padding: 32px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .functional-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -10px rgba(120, 113, 108, 0.12);
        }
        
        .functional-card.featured-highlight {
          border: 1px solid #bfdbfe;
          background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(244,248,255,0.95) 100%);
        }
        .card-icon-wrap {
          width: 40px; height: 40px; background: #f5f4f0; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
        }
        .featured-highlight .card-icon-wrap {
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
        }
        .card-title { font-size: 16px; font-weight: 700; color: #1c1917; margin: 0 0 12px 0; }
        .card-desc { font-size: 13px; color: #6b6661; line-height: 1.6; margin: 0; }

        /* ── MODAL BLUR POPUP WINDOW ── */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(28, 25, 23, 0.3);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }
        .login-card {
          background: #ffffff;
          width: 100%;
          max-width: 860px;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(28, 25, 23, 0.15);
          border: 1px solid #e1dbd6;
          position: relative;
          padding: 48px;
        }
        .close-modal-btn {
          position: absolute;
          top: 24px; right: 24px;
          background: none; border: none;
          font-size: 24px; color: #a8a29e; cursor: pointer;
        }
        .close-modal-btn:hover { color: #1c1917; }
        
        .login-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); 
          border: 1px solid #bfdbfe; border-radius: 100px;
          padding: 5px 14px; font-size: 11px; font-weight: 700; color: #1e40af;
          margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        
        .auth-horizontal-form {
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          gap: 20px;
          width: 100%;
        }
        .field-group { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .field-label { font-size: 12px; font-weight: 700; color: #44403c; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
        .field-input-wrap { position: relative; }
        .field-input {
          width: 100%; height: 48px; padding: 0 16px; border: 1.5px solid #d6d3d1;
          border-radius: 8px; font-size: 14px; outline: none; transition: all 0.15s;
          background: #ffffff; color: #1c1917;
        }
        .field-input:focus { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1); }
        .field-input.with-toggle { padding-right: 46px; }
        
        .submit-btn-wrap { flex: 0 0 auto; }
        .submit-btn {
          height: 48px; padding: 0 36px; 
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          color: #ffffff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.15s;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.95; }
        .submit-btn:disabled { background: #a8a29e; cursor: not-allowed; }

        @media (max-width: 992px) {
          .auth-horizontal-form { flex-direction: column; align-items: stretch; gap: 16px; }
        }
        @media (max-width: 768px) {
          .hero-container { grid-template-columns: 1fr; gap: 40px; padding: 60px 20px; }
          .hero-cta-group { flex-direction: column; align-items: stretch; gap: 12px; }
          .functional-grid { grid-template-columns: 1fr; }
          .nav-bar { padding: 20px; }
        }
      ` }} />

      {/* ── Navigation Header ── */}
      <header className="nav-bar">
        <div className="brand-logo">
          <Shield size={24} color="#1d4ed8" />
          <span>GuardianPath AI</span>
        </div>
        <button className="nav-btn" onClick={() => setIsModalOpen(true)}>
          <LogIn size={15} />
          Sign In
        </button>
      </header>

      {/* ── Hero Unit ── */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-text">
            <div className="hero-badge">
              Safety Education Platform
            </div>
            <h1>Making Campus Disaster Preparedness Safe, Smart, and Gamified</h1>
            <p>
              Transforming traditional safety blueprints into interactive learning experiences. GuardianPath AI lets school administrators, instructors, and students connect on a single portal to master critical emergency training together.
            </p>
            {/* Action Buttons */}
            <div className="hero-cta-group">
              <button className="nav-btn" style={{ padding: '14px 32px', borderRadius: '8px', fontSize: '15px' }} onClick={() => setIsModalOpen(true)}>
                Enter Dashboard <ArrowRight size={16} />
              </button>
              <button className="btn-secondary" onClick={() => scrollToSection(howItWorksRef)}>
                How It Works
              </button>
            </div>
          </div>

          {/* Simple Visual Preview Panel */}
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

      {/* ── How It Works Grid ── */}
      <section className="functional-section" ref={howItWorksRef}>
        <div className="section-header">
          <h2 className="section-title">How the Portal Works</h2>
          <p className="section-subtitle">A balanced overview of features tailored specifically to your entire campus ecosystem.</p>
        </div>

        <div className="functional-grid">
          {/* Elegant Highlighted Blueprint Conversion Module Card */}
          <div className="functional-card featured-highlight">
            <div className="card-icon-wrap"><Sparkles size={18} color="#1d4ed8" /></div>
            <h3 className="card-title">Smart Blueprint Conversion</h3>
            <p className="card-desc">Administrators can directly upload standard floor plan architectures and safety layouts. Our engine maps the geometry instantly, safely converting physical drawings into 3D environments ready for student simulations.</p>
          </div>

          <div className="functional-card">
            <div className="card-icon-wrap"><Layers size={18} color="#1d4ed8" /></div>
            <h3 className="card-title">Instructor Control Panels</h3>
            <p className="card-desc">Teachers easily manage student rosters, view progress charts, and create custom local quizzes. They can inject localized questions focused on specific classroom locations and safety tools.</p>
          </div>

          <div className="functional-card">
            <div className="card-icon-wrap"><BookOpen size={18} color="#1d4ed8" /></div>
            <h3 className="card-title">Student Learning Environments</h3>
            <p className="card-desc">Students practice safely by running through simulations of their own school buildings. The framework measures their evacuation timing and offers automated safety videos alongside testing modules.</p>
          </div>
        </div>
      </section>

      {/* ── CENTERED SIGN-IN POPUP WITH BLUR ── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="login-card">
            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>×</button>
            
            <div className="login-eyebrow">
              <Lock size={10} style={{ marginRight: '4px' }} /> Automated Portal Access
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>Sign in to GuardianPath</h2>
              <p style={{ color: '#78716c', fontSize: '14px', margin: 0 }}>
                Enter your assigned details below. The system automatically routes students, teachers, and admins to their proper workspaces.
              </p>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: '8px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '14px 16px', color: '#b91c1c', fontSize: '13px', marginBottom: '24px', fontWeight: 500 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Flat Horizontal Single Sign-In Form */}
            <form onSubmit={handleSubmit} className="auth-horizontal-form">
              <div className="field-group">
                <label className="field-label">
                  <User size={13} color="#1d4ed8" /> Username / ID / Roll Number
                </label>
                <div className="field-input-wrap">
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Enter your ID or roll number"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">
                  <KeyRound size={13} color="#1d4ed8" /> Password / Full Name
                </label>
                <div className="field-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="field-input with-toggle"
                    placeholder="Enter password or your full name"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', display: 'flex', alignItems: 'center', padding: '4px' }}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="submit-btn-wrap">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Entering Portal…' : 'Access Account'}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#f5f4f0', border: '1px solid #e7e5e4', borderRadius: '8px', fontSize: '12px', color: '#6b6661' }}>
              <Globe size={14} color="#78716c" />
              <span>Secure, managed link established. Safe workspace environment active.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}