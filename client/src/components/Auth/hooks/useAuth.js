import { useState } from 'react';

export function useAuth(onLoginSuccess) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return {
    isModalOpen, setIsModalOpen, username, setUsername, password, setPassword,
    showPassword, setShowPassword, error, loading, handleSubmit
  };
}
