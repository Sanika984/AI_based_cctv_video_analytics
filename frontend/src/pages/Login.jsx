import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Aperture, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const demoAccounts = [
    { label: 'Admin', username: 'admin', password: 'admin123' },
    { label: 'Operator', username: 'operator', password: 'operator123' },
    { label: 'Viewer', username: 'viewer', password: 'viewer123' },
  ];

  const handleQuickFill = (preset) => {
    setUsername(preset.username);
    setPassword(preset.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await login(username.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#DEE5FF] font-space flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] flex flex-col gap-6">
        
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#05183C] border border-[#2B4680]/40 flex items-center justify-center text-[#4EDEA3]">
            <Aperture size={26} strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-bold tracking-[1.5px] uppercase">Sentinel Lens</h1>
        </div>

        {/* Card */}
        <div className="bg-[#05183C] border border-[#2B4680]/40 rounded-xl p-6 flex flex-col gap-4 shadow-xl">
          <h2 className="text-base font-bold text-[#DEE5FF]">Sign In</h2>

          {error && (
            <div className="bg-red-950/40 border border-red-500/40 text-red-200 text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[#91AAEB] font-mono text-[10px] uppercase">Username</label>
              <div className="relative flex items-center">
                <User size={14} className="absolute left-3 text-[#91AAEB] pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  required
                  className="w-full bg-[#020617] border border-[#2B4680]/50 rounded-lg pl-9 pr-3 py-2 text-[#DEE5FF] placeholder-[#91AAEB]/40 focus:outline-none focus:border-[#4EDEA3]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[#91AAEB] font-mono text-[10px] uppercase">Password</label>
              <div className="relative flex items-center">
                <Lock size={14} className="absolute left-3 text-[#91AAEB] pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#020617] border border-[#2B4680]/50 rounded-lg pl-9 pr-9 py-2 text-[#DEE5FF] placeholder-[#91AAEB]/40 focus:outline-none focus:border-[#4EDEA3]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-[#91AAEB] hover:text-[#DEE5FF] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full bg-[#4EDEA3] hover:bg-[#4EDEA3]/90 text-[#020617] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer text-xs"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Presets */}
          <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase text-[#91AAEB]">Quick Fill</span>
            <div className="grid grid-cols-3 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className="py-1.5 px-2 rounded bg-[#020617] border border-white/5 hover:border-[#4EDEA3]/50 text-[11px] font-mono text-[#91AAEB] hover:text-[#DEE5FF] transition-colors cursor-pointer text-center"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
