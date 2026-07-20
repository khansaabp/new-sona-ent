import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Sign up to start shopping and track your orders and invoices.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Full name</label>
            <input className="input" name="name" required value={form.name} onChange={handleChange} placeholder="Your name" />
          </div>
          <div className="field">
            <label className="label">Email address</label>
            <input className="input" name="email" type="email"  value={form.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label className="label">Phone number</label>
            <input className="input" name="phone" required value={form.phone} onChange={handleChange} placeholder="9999999999" />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input className="input" name="password" type="password" required minLength={6} value={form.password} onChange={handleChange} placeholder="At least 6 characters" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-muted" style={{ marginTop: 20, fontSize: 14 }}>
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
