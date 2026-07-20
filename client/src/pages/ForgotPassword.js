import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('phone'); // 'phone' | 'reset'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { phone });
      setStep('reset');
      setInfo('OTP sent to your phone number.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { phone, otp, newPassword });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          {step === 'phone'
            ? "Enter your registered phone number to receive a reset code."
            : "Enter the OTP sent to your phone and choose a new password."}
        </p>

        {error && <div className="error-banner">{error}</div>}
        {info && <div className="success-banner">{info}</div>}

        {step === 'phone' ? (
          <form onSubmit={handleRequestOTP}>
            <div className="field">
              <label className="label">Phone number</label>
              <input
                className="input"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
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
            <div className="field">
              <label className="label">New password</label>
              <input
                className="input"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div className="field">
              <label className="label">Confirm new password</label>
              <input
                className="input"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => setStep('phone')}
            >
              Change phone number
            </button>
          </form>
        )}

        <p className="text-muted" style={{ marginTop: 20, fontSize: 14 }}>
          <Link to="/login" className="auth-link">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;