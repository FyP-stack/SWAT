import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserPlus, Mail, Lock, User, Check, X } from 'lucide-react';
import './Auth.css';

function strengthChecks(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[!@#$%^&*()_\-+=[\]{}|;:,.<>?]/.test(pw),
    space: !/\s/.test(pw),
  };
}

function score(pw: string) {
  const c = strengthChecks(pw);
  return ['length','upper','lower','digit','special','space'].reduce((s,k)=> s + (c as any)[k], 0);
}

export default function Signup() {
  const { signup } = useAuth();

  const [fullName, setFullName] = useState('');
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

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (pct < 67) {
      setError('Choose a stronger password (meet requirements).');
      return;
    }

    const result = await signup(email.trim(), password, fullName);
    if (!result.ok) {
      setError(result.reason || 'Could not create account.');
      return;
    }
    setSuccess(true);
    setPassword('');
    setConfirm('');
  };

return (
  <div className="auth-wrapper">   
    {/* LEFT SIDE — SIGNUP FORM */}
    <div className="form-section">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <UserPlus size={48} />
          </div>
          <h1 className="auth-title sky">Create Account</h1>
          <p className="auth-subtitle">Join SWaT anomaly detection</p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullname">Full Name</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="fullname"
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                className="input-with-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
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
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="StrongP@ssw0rd!"
                autoComplete="new-password"
                className="input-with-icon"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="pwmeter">
              <div className="bar" style={{ width: pct + '%' }} />
            </div>
            <ul className="pwtips">
              <li className={checks.length ? 'ok':'no'}>
                {checks.length ? <Check size={14} /> : <X size={14} />}
                At least 8 characters
              </li>
              <li className={checks.lower ? 'ok':'no'}>
                {checks.lower ? <Check size={14} /> : <X size={14} />}
                Lowercase letter
              </li>
              <li className={checks.special ? 'ok':'no'}>
                {checks.special ? <Check size={14} /> : <X size={14} />}
                Special character
              </li>
              <li className={checks.upper ? 'ok':'no'}>
                {checks.upper ? <Check size={14} /> : <X size={14} />}
                Uppercase letter
              </li>
              <li className={checks.digit ? 'ok':'no'}>
                {checks.digit ? <Check size={14} /> : <X size={14} />}
                Digit (0-9)
              </li>
              <li className={checks.space ? 'ok':'no'}>
                {checks.space ? <Check size={14} /> : <X size={14} />}
                No spaces
              </li>
            </ul>
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                className="input-with-icon"
              />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && (
            <div className="auth-success">
              Account created. You can now <Link to="/login" className="inline-link">sign in</Link>.
            </div>
          )}

          <button className="auth-button" type="submit">
            <UserPlus size={18} />
            Create Account
          </button>
        </form>

        <div className="auth-bottom-row corner">
          <span className="auth-info-highlight">Already have an account?</span>
          <Link to="/login" className="auth-button auth-create-one-btn">Sign in</Link>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE — IMAGE */}
    <div className="image-section">
      <img
        className="auth-image"
        src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=900&q=80"
        alt="Signup visualization"
      />
    </div>
  </div>
);

}
