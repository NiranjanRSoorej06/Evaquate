import { useRef } from 'react';
import './Auth.css';
import { useAuth } from './hooks/useAuth';
import AuthNavBar from './AuthNavBar';
import AuthHero from './AuthHero';
import AuthFeatures from './AuthFeatures';
import LoginModal from './LoginModal';

export default function Auth({ onLoginSuccess }) {
  const howItWorksRef = useRef(null);
  const auth = useAuth(onLoginSuccess);

  const scrollToSection = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="auth-page">
      <AuthNavBar onSignInClick={() => auth.setIsModalOpen(true)} />
      <AuthHero onSignInClick={() => auth.setIsModalOpen(true)} onHowItWorksClick={scrollToSection} />
      <AuthFeatures sectionRef={howItWorksRef} />
      {auth.isModalOpen && (
        <LoginModal
          onClose={() => auth.setIsModalOpen(false)}
          username={auth.username}
          setUsername={auth.setUsername}
          password={auth.password}
          setPassword={auth.setPassword}
          showPassword={auth.showPassword}
          setShowPassword={auth.setShowPassword}
          loading={auth.loading}
          onSubmit={auth.handleSubmit}
        />
      )}
    </div>
  );
}
