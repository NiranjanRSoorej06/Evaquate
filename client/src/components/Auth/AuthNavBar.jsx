import logoImg from '../../assets/logo_3.png';
import { LogIn } from 'lucide-react';

export default function AuthNavBar({ onSignInClick }) {
  return (
    <header className="nav-bar">
      <div className="brand-logo">
        <img src={logoImg} alt="EVAQUATE" style={{ height: '32px', width: 'auto' }} />
        <span>EVAQUATE</span>
      </div>
      <button className="nav-btn" onClick={onSignInClick}>
        <LogIn size={15} />
        Sign In
      </button>
    </header>
  );
}
