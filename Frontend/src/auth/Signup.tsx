import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

export default function Signup() {
  const { signup } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const s = useMemo(() => score(password), [password]);
  const checks = useMemo(() => strengthChecks(password), [password]);
  const pct = Math.min(100, Math.round((s / 6) * 100));

  const onSubmit = async (e: React.FormEvent) => {
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
    // Show success message; keep user on signup page unauthenticated.
    setSuccess(true);
    // Optionally clear password fields:
    setPassword('');
    setConfirm('');
  };

return (
  <div className="auth-wrapper">   
    {/* LEFT SIDE — SIGNUP FORM */}
    <div className="auth-left">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">💧</div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Access SWaT anomaly detection</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
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
              Account created. You can now <Link to="/login" className="inline-link">sign in</Link>.
            </div>
          )}

          <button className="auth-btn" type="submit">Create Account</button>
        </form>

        <div className="auth-bottom-row corner">
          <span className="auth-info-highlight">Already have an account?</span>
          <Link to="/login" className="auth-btn auth-create-one-btn">Sign in</Link>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE — IMAGE */}
    <div className="auth-right">
      <img
        className="auth-image"
        src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80"
        alt="Signup visualization"
      />
    </div>
  </div>
);

}
