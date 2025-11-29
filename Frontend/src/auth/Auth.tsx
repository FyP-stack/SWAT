import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Auth.css';

function strengthChecks(pw: string) {
  return {
    length: pw.length >= 10,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
    space: !/\s/.test(pw),
  };
}
function score(pw: string) {
  const c = strengthChecks(pw);
  return ['length','upper','lower','digit','special','space'].reduce((s,k)=> s + (c as any)[k], 0);
}

const signupImage = '/images/sensor-network.svg';
const loginImage = '/images/water-monitoring.svg';

interface AuthProps {
  mode: 'signup' | 'login';
}

export default function Auth({ mode }: AuthProps) {
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  // State for the current mode
  const [isLogin, setIsLogin] = useState(mode === 'login');

  // Common states
  const [loading, setLoading] = useState(false);

  // Signup states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Error
  const [error, setError] = useState('');

  const s = useMemo(() => score(password), [password]);
  const checks = useMemo(() => strengthChecks(password), [password]);
  const pct = Math.min(100, Math.round((s / 6) * 100));

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess(false);
  };

  const onSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (pct < 84) {
      setError('Choose a stronger password (meet all listed requirements).');
      return;
    }

    const result = await signup(email.trim(), password);
    if (!result.ok) {
      setError(result.reason || 'Could not create account.');
      return;
    }
    setSuccess(true);
    setPassword('');
    setConfirm('');
  };

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (loginEmail && loginPassword) {
        await login(loginEmail, loginPassword);
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
    <div className={`auth-wrapper ${isLogin ? 'login' : 'signup'}`}>
      {/* FORM SECTION */}
      <div className="form-section">
        <div className="auth-card">
          {!isLogin ? (
            // SIGNUP FORM
            <>
              <div className="auth-header">
                <div className="auth-logo">💧</div>
                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Access SWaT anomaly detection</p>
              </div>

              <form onSubmit={onSignupSubmit} className="auth-form">
                <div className="form-group">
                  <label>First name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane"
                    autoComplete="given-name"
                  />
                </div>

                <div className="form-group">
                  <label>Last name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="StrongP@ssw0rd!"
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <div className="pwmeter"><div className="bar" style={{ width: pct + '%' }} /></div>
                  <ul className="pwtips">
                    <li className={checks.length ? 'ok':'no'}>At least 10 characters</li>
                    <li className={checks.lower ? 'ok':'no'}>Lowercase letter</li>
                    <li className={checks.special ? 'ok':'no'}>Special character</li>
                    <li className={checks.upper ? 'ok':'no'}>Uppercase letter</li>
                    <li className={checks.digit ? 'ok':'no'}>Digit</li>
                    <li className={checks.space ? 'ok':'no'}>No spaces</li>
                  </ul>
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}
                {success && (
                  <div className="auth-success">
                    Account created. You can now <button onClick={toggleMode} className="inline-link" style={{background:'none',border:'none',color:'#0b6fb0',fontWeight:'700',cursor:'pointer'}} >sign in</button>.
                  </div>
                )}

                <button className="auth-btn" type="submit">Create Account</button>
              </form>

              <div className="auth-bottom-row corner">
                <span className="auth-info-highlight">Already have an account?</span>{' '}
                <button
                  className="auth-btn auth-create-one-btn"
                  onClick={toggleMode}
                  type="button"
                >
                  Sign in
                </button>
              </div>
            </>
          ) : (
            // LOGIN FORM
            <>
              <div className="auth-header">
                <div className="auth-logo">💧</div>
                <h1 className="auth-title">Sign in to SWaT</h1>
                <p className="auth-subtitle">Access secure water monitoring</p>
              </div>

              <form onSubmit={onLoginSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="operator@swat.com"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="auth-footer">
                Don't have an account?{' '}
                <button
                  onClick={toggleMode}
                  className="auth-link"
                  style={{background:'none',border:'none',cursor:'pointer',color:'#3b82f6',textDecoration:'none'}}
                >
                  Create one
                </button>
              </div>
            </>
          )}
        </div>
      </div>


    </div>
  );
}
