import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Aperture, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4 text-[#DEE5FF]">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 border-[#2B4680]/40 border-t-[#4EDEA3] animate-spin" />
          <Aperture className="absolute text-[#4EDEA3]" size={24} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-space font-bold tracking-[2px] uppercase">
            Verifying Security Credentials
          </span>
          <span className="text-xs font-mono text-[#91AAEB]">Establishing encrypted session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="flex-1 w-full min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-[480px] w-full bg-[#05183C]/90 border border-red-500/30 rounded-2xl p-8 flex flex-col items-center text-center gap-5 shadow-[0_10px_35px_rgba(239,68,68,0.1)]">
          <div className="w-16 h-16 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-center justify-center text-red-400">
            <ShieldAlert size={32} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono font-bold tracking-[1.5px] uppercase text-red-400">
              Access Restricted
            </span>
          </div>

          <div className="w-full bg-[#020617]/70 border border-[#2B4680]/40 rounded-lg p-3 flex justify-between items-center text-xs font-mono">
            <span className="text-[#91AAEB]">Your Role:</span>
            <span className="text-[#DEE5FF] font-bold uppercase px-2 py-0.5 rounded bg-[#031D4B] border border-[#2B4680]">
              {user?.role || 'Unknown'}
            </span>
          </div>

          <div className="w-full bg-[#020617]/70 border border-[#2B4680]/40 rounded-lg p-3 flex justify-between items-center text-xs font-mono">
            <span className="text-[#91AAEB]">Required Role(s):</span>
            <span className="text-[#4EDEA3] font-bold uppercase">
              {allowedRoles.join(', ')}
            </span>
          </div>

          <Link
            to="/"
            className="mt-2 w-full bg-[#031D4B] hover:bg-[#031D4B]/70 border border-[#2B4680] text-[#DEE5FF] font-space font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Return to Live Monitoring</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
