import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck, ArrowRight, PackageCheck, Truck, Boxes } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="arctic-portal">
      {/* BACKGROUND ELEMENTS */}
      <div className="portal-bg">
        <div className="aurora"></div>
        <div className="data-lines"></div>
      </div>
      
      <div className="portal-frame animate-reveal">
        <div className="frame-left">
          <div className="portal-brand">
            <PackageCheck className="neon-text" size={48} />
            <h1 className="syncopate">GVS PACKAGES</h1>
            <p className="syncopate">Packaging & Food Supply ERP</p>
          </div>
          
          <div className="portal-message">
            <h2 className="syncopate">BUSINESS <br />CONTROL DESK</h2>
            <div className="message-details">
              <p className="grotesk">Manage foil covers, brown covers, aluminium containers, dairy, frozen meat, and ready-to-cook food supply from one workspace.</p>
              <div className="integrity-status">
                <Boxes size={16} />
                <span>STOCK, BILLING, CLIENTS, AND DISPATCH</span>
              </div>
            </div>
          </div>
          
          <div className="tech-belt">
            <div className="tech-node"><Truck size={14} /> <span>SUPPLY READY</span></div>
            <div className="tech-node"><ShieldCheck size={14} /> <span>ROLE CONTROLLED</span></div>
          </div>
        </div>

        <div className="frame-right">
          <div className="auth-module">
            <div className="module-header">
              <h3 className="syncopate">Authentication</h3>
              <p className="grotesk">Sign in to continue daily operations.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {error && (
                <div className="error-node animate-shake">
                  <span className="syncopate">SIGN IN FAILED</span>
                  <p>{error}</p>
                </div>
              )}
              
              <div className="auth-input">
                <label className="syncopate">Email</label>
                <div className="input-wrap">
                  <Mail size={18} className="icon" />
                  <input
                    type="email"
                    placeholder="admin@gvserp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input">
                <div className="label-row">
                  <label className="syncopate">Password</label>
                  <a href="#" className="forgot syncopate">Need help?</a>
                </div>
                <div className="input-wrap">
                  <Lock size={18} className="icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="initialize-btn" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={24} className="spin" />
                ) : (
                  <>
                    <span className="syncopate">SIGN IN</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className="grotesk">GVS Packages business operations &copy; 2026</p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default LoginPage;
