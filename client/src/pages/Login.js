import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Access your orders, invoices, and (for staff) the sales dashboard.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
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

        <div className="auth-demo">
          <div className="text-muted mono" style={{ fontSize: 12, marginBottom: 6 }}>Demo accounts (after seeding):</div>
          <div className="mono" style={{ fontSize: 12 }}>admin@electroshop.com / admin123</div>
          <div className="mono" style={{ fontSize: 12 }}>staff@electroshop.com / staff123</div>
          <div className="mono" style={{ fontSize: 12 }}>customer@example.com / customer123</div>
        </div>

        <p className="text-muted" style={{ marginTop: 20, fontSize: 14 }}>
          New here? <Link to="/register" className="auth-link">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
