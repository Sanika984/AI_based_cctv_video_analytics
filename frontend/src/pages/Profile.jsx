import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const getRoleStyle = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-[#4EDEA3]/10 text-[#4EDEA3] border-[#4EDEA3]/30';
      case 'operator':
        return 'bg-[#91AAEB]/10 text-[#91AAEB] border-[#91AAEB]/30';
      default:
        return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[600px] font-space pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#DEE5FF]">Account</h1>
        <p className="text-xs text-[#91AAEB] mt-1">Manage your active session and credentials.</p>
      </div>

      <div className="bg-[#05183C] border border-[rgba(43,70,128,0.2)] rounded-xl p-6 flex flex-col gap-6 shadow-sm">
        
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#020617] border border-white/10 flex items-center justify-center font-bold text-lg text-[#4EDEA3] uppercase">
            {user?.username ? user.username[0] : 'U'}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#DEE5FF] capitalize">{user?.username}</h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${getRoleStyle(user?.role)}`}>
                {user?.role}
              </span>
            </div>
            <span className="text-xs font-mono text-[#91AAEB]/70">{user?.user_id}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#020617] border border-white/5 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#91AAEB]">Status</span>
            <span className="text-[#4EDEA3] font-mono font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4EDEA3]" />
              Active
            </span>
          </div>

          <div className="p-3 bg-[#020617] border border-white/5 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase text-[#91AAEB]">Role Level</span>
            <span className="text-[#DEE5FF] font-medium capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
}
