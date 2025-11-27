import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate login - in production, call your auth API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        login({ email, name: email.split('@')[0] });
        navigate('/dashboard');
      } else {
        setError('Please enter email and password');
      }
    } catch (err) {
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="water-background">
        <div className="water-wave"></div>
        <div className="water-wave"></div>
        <div className="water-wave"></div>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="bubble"
            style={{
              width: `${Math.random() * 60 + 20}px`,
              height: `${Math.random() * 60 + 20}px`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">💧</div>
          <h1 className="auth-title">Sign in to SWaT</h1>
          <p className="auth-subtitle">Use your plant operator account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@swat.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="auth-footer">
            <span>Don't have an account?</span>
            <Link to="/signup" className="auth-link">Create one</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;