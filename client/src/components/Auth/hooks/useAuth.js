import { useState } from 'react';
import { useToast } from '../../../components/Toast';

// ---------------------------------------------------------------------------
// Username format rules
//   superadmin  -> literal "superadmin"
//   admin       -> exactly 3 digits  e.g.  123
//   teacher     -> [a-z]{3}_\d+_[a-z]   e.g.  vid_1_a
//   student     -> [a-z]{3}_\d+_[a-z]_\d+   e.g.  vid_1_a_23
// ---------------------------------------------------------------------------
const FORMAT_PATTERNS = [
  { role: 'superadmin', regex: /^superadmin$/i },
  { role: 'admin',      regex: /^[a-z]{3}$/i },
  { role: 'teacher',    regex: /^[a-z]{3}_\d+_[a-z]$/i },
  { role: 'student',    regex: /^[a-z]{3}_\d+_[a-z]_\d+$/i },
];

export function detectRole(username) {
  if (!username) return null;
  for (const { role, regex } of FORMAT_PATTERNS) {
    if (regex.test(username.trim())) return role;
  }
  return null;
}

export function useAuth(onLoginSuccess) {
  const addToast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- client-side format check ---
    const role = detectRole(username);
    if (!role) {
      addToast(
        'Invalid ID format. Accepted formats:\n' +
        '• superadmin\n' +
        '• ABC  (3-letter school code, admin)\n' +
        '• abc_1_a  (teacher)\n' +
        '• abc_1_a_23  (student)',
        'error'
      );
      return;
    }
    // ---------------------------------

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
        skipGlobalToast: true
      });
      const data = await response.json();
      if (data.success) {
        setIsModalOpen(false);
        onLoginSuccess(data.user);
      } else {
        addToast(data.message || 'Sign in failed. Please check your credentials and try again.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Unable to connect to the server. Please verify your connection or try again later.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    isModalOpen, setIsModalOpen, username, setUsername, password, setPassword,
    showPassword, setShowPassword, loading, handleSubmit
  };
}
