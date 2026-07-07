import { Shield, LogIn } from 'lucide-react';

export default function AuthNavBar({ onSignInClick }) {
  return (
    <header className="nav-bar">
      <div className="brand-logo">
        <Shield size={24} color="#1d4ed8" />
        <span>GuardianPath AI</span>
      </div>
      <button className="nav-btn" onClick={onSignInClick}>
        <LogIn size={15} />
        Sign In
      </button>
    </header>
  );
}
