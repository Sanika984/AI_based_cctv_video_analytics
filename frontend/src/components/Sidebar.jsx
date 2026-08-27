import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Video,
  BarChart2,
  CarFront,
  ShieldAlert,
  Settings,
  User,
  Users,
  HelpCircle,
  History,
  Aperture,
  LogOut,
  Shield,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Live Stream', icon: Video, path: '/' },
    { name: 'Consumer Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Vehicle Detection', icon: CarFront, path: '/vehicles' },
    { name: 'Security Alerts', icon: ShieldAlert, path: '/alerts' },
    {
      name: 'Camera Config',
      icon: Settings,
      path: '/config',
      adminOnly: true
    },
    {
      name: 'User Management',
      icon: Users,
      path: '/users',
      adminOnly: true
    },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const bottomItems = [
    { name: 'Logs', icon: History, path: '/logs' },
  ];

  const getRoleBadgeStyle = (role) => {
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
    <aside className={`fixed left-0 top-0 h-full bg-brand-bg flex flex-col z-10 border-r border-white/5 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Header */}
      <div className={`flex items-center p-6 h-[88px] w-full shrink-0 overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'flex-col items-start gap-1'}`}>
        {!isCollapsed ? (
          <div className="flex flex-col items-start w-full min-w-max">
            <h1 className="text-brand-text font-space font-bold uppercase tracking-[2px] text-xl leading-7 m-0">
              Sentinel Lens
            </h1>
            <span className="text-brand-sub font-space font-normal uppercase tracking-[0.5px] text-[10px] opacity-60 leading-tight">
              Supermarket Node 04
            </span>
          </div>
        ) : (
          <div className="w-10 h-10 bg-[#05183C] border border-white/5 rounded-lg flex items-center justify-center shrink-0">
            <Aperture className="text-brand-accent" size={20} />
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className={`flex flex-col px-4 gap-2 w-full mt-4 flex-1 overflow-y-auto scrollbar-hide ${isCollapsed ? 'items-center' : 'items-start'}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isRestricted = item.adminOnly && !isAdmin;

          return (
            <Link
              key={item.name}
              to={item.path}
              title={isCollapsed ? `${item.name}${item.adminOnly ? ' (Admin Only)' : ''}` : undefined}
              className={`flex flex-row items-center p-3 w-full transition-colors box-border rounded-md group ${isActive
                  ? 'bg-brand-active border-l-[4px] border-l-brand-accent'
                  : 'border-l-[4px] border-l-transparent hover:bg-white/5'
                } ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'gap-4 justify-between'}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <item.icon
                    size={20}
                    className={isActive ? "text-brand-accent" : "text-brand-muted"}
                    strokeWidth={2}
                  />
                </div>
                {!isCollapsed && (
                  <span className={`font-space font-medium text-sm leading-5 tracking-[-0.4px] truncate ${isActive ? "text-brand-accent" : "text-brand-muted"
                    }`}>
                    {item.name}
                  </span>
                )}
              </div>

              {!isCollapsed && item.adminOnly && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase border shrink-0 ${isAdmin
                    ? 'border-[#4EDEA3]/30 text-[#4EDEA3] bg-[#4EDEA3]/10'
                    : 'border-white/10 text-[#8F9FB7] bg-white/5 flex items-center gap-1'
                  }`}>
                  {isAdmin ? 'ADMIN' : <Lock size={10} />}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Session Info Card */}
      {user && (
        <div className={`px-4 py-3 border-t border-t-[rgba(43,70,128,0.1)] w-full shrink-0 ${isCollapsed ? 'flex justify-center' : 'flex items-center justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
              <div className="w-8 h-8 rounded-lg bg-[#05183C] border border-[#2B4680]/40 flex items-center justify-center text-[#4EDEA3] shrink-0 font-bold text-xs uppercase">
                {user.username ? user.username[0] : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#DEE5FF] truncate font-space capitalize">
                  {user.username}
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase self-start mt-0.5 ${getRoleBadgeStyle(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
          ) : (
            <div
              title={`${user.username} (${user.role})`}
              className="w-8 h-8 rounded-lg bg-[#05183C] border border-[#2B4680]/40 flex items-center justify-center text-[#4EDEA3] font-bold text-xs uppercase cursor-pointer"
            >
              {user.username ? user.username[0] : 'U'}
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-[#91AAEB] hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      )}

      {/* Bottom Nav */}
      <div className={`flex flex-col px-4 py-3 gap-2 border-t border-t-[rgba(43,70,128,0.1)] w-full shrink-0 ${isCollapsed ? 'items-center' : 'items-start'}`}>
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex flex-row items-center p-2.5 w-full transition-colors box-border rounded-md ${isActive
                  ? 'bg-brand-active border-l-[4px] border-l-brand-accent'
                  : 'border-l-[4px] border-l-transparent hover:bg-white/5'
                } ${isCollapsed ? 'justify-center w-10 h-10 p-0' : 'gap-4'}`}
            >
              <div className="flex flex-col items-center justify-center shrink-0">
                <item.icon
                  size={18}
                  className={isActive ? "text-brand-accent" : "text-brand-muted"}
                  strokeWidth={2}
                />
              </div>
              {!isCollapsed && (
                <span className={`font-space font-medium text-xs leading-5 tracking-[-0.4px] whitespace-nowrap ${isActive ? "text-brand-accent" : "text-brand-muted"
                  }`}>
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
