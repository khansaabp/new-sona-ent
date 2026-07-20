import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login, loginWithPhone, requestOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState('email'); // 'email' | 'phone' | 'otp'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) navigate(redirect);
    else setError(res.message);
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await loginWithPhone(phone, password);
    setLoading(false);
    if (res.success) navigate(redirect);
    else setError(res.message);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const res = await requestOTP(phone);
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
      setInfo('OTP sent to your phone number.');
    } else {
      setError(res.message);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await verifyOTP(phone, otp);
    setLoading(false);
    if (res.success) navigate(redirect);
    else setError(res.message);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setInfo('');
    setOtpSent(false);
    setOtp('');
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="text-muted" style={{ marginBottom: 20 }}>
          Access your orders, invoices, and (for staff) the sales dashboard.
        </p>

        <div className="auth-mode-tabs">
          <button className={`auth-mode-tab ${mode === 'email' ? 'auth-mode-tab--active' : ''}`} onClick={() => switchMode('email')}>
            Email
          </button>
          <button className={`auth-mode-tab ${mode === 'phone' ? 'auth-mode-tab--active' : ''}`} onClick={() => switchMode('phone')}>
            Phone + Password
          </button>
          <button className={`auth-mode-tab ${mode === 'otp' ? 'auth-mode-tab--active' : ''}`} onClick={() => switchMode('otp')}>
            Phone OTP
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {info && <div className="success-banner">{info}</div>}

        {mode === 'email' && (
          <form onSubmit={handleEmailLogin}>
            <div className="field">
              <label className="label">Email address</label>
              <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {mode === 'phone' && (
          <form onSubmit={handlePhoneLogin}>
            <div className="field">
              <label className="label">Phone number</label>
              <input className="input" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOTP}>
                <div className="field">
                  <label className="label">Phone number</label>
                  <input className="input" type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div className="field">
                  <label className="label">Enter 6-digit OTP</label>
                  <input
                    className="input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    placeholder="123456"
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '4px', textAlign: 'center', fontSize: 18 }}
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Sign in'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                >
                  Change phone number
                </button>
              </form>
            )}
          </div>
        )}

        {mode !== 'otp' && (
          <p className="text-muted" style={{ marginTop: 16, fontSize: 13 }}>
            <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
          </p>
        )}
{/* 
        <div className="auth-demo">
          <div className="text-muted mono" style={{ fontSize: 12, marginBottom: 6 }}>Demo accounts (after seeding):</div>
          <div className="mono" style={{ fontSize: 12 }}>admin@electroshop.com / admin123</div>
          <div className="mono" style={{ fontSize: 12 }}>staff@electroshop.com / staff123</div>
          <div className="mono" style={{ fontSize: 12 }}>customer@example.com / customer123</div>
        </div> */}

        <p className="text-muted" style={{ marginTop: 20, fontSize: 14 }}>
          New here? <Link to="/register" className="auth-link">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;