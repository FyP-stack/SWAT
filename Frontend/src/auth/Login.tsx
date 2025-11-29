import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';
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
      if (email && password) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        setError('Please enter email and password');
      }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper login">
      
      {/* LEFT (or right on desktop depending on class) */}
      <div className="form-section">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Lock size={48} />
            </div>
            <h1 className="auth-title sky">Sign In to SWaT</h1>
            <p className="auth-subtitle">Access secure water monitoring</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@swat.com"
                  required
                  disabled={loading}
                  className="input-with-icon"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="input-with-icon"
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">Create one</Link>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE IMAGE */}
      <div className="image-section">
        <img
          className="auth-image"
          src="/images/sensor-network.jpeg"
          alt="Water monitoring system"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

    </div>
  );
};

export default Login;
