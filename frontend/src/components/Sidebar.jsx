import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Video, 
  BarChart2, 
  CarFront, 
  ShieldAlert, 
  Settings, 
  User, 
  HelpCircle, 
  History,
  Aperture
} from 'lucide-react';

export default function Sidebar({ isCollapsed }) {
  const location = useLocation();

  const navItems = [
    { name: 'Live Stream', icon: Video, path: '/' },
    { name: 'Consumer Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Vehicle Detection', icon: CarFront, path: '/vehicles' },
    { name: 'Security Alerts', icon: ShieldAlert, path: '/alerts' },
    { name: 'Camera Config', icon: Settings, path: '/config' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const bottomItems = [
    { name: 'Support', icon: HelpCircle, path: '/support' },
    { name: 'Logs', icon: History, path: '/logs' },
  ];

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
      <nav className={`flex flex-col px-4 gap-2 w-full mt-4 flex-1 ${isCollapsed ? 'items-center' : 'items-start'}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex flex-row items-center p-3 w-full transition-colors box-border rounded-md ${
                isActive 
                  ? 'bg-brand-active border-l-[4px] border-l-brand-accent' 
                  : 'border-l-[4px] border-l-transparent hover:bg-white/5'
              } ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'gap-4'}`}
            >
              <div className="flex flex-col items-center justify-center shrink-0">
                <item.icon 
                  size={20} 
                  className={isActive ? "text-brand-accent" : "text-brand-muted"} 
                  strokeWidth={2}
                />
              </div>
              {!isCollapsed && (
                <span className={`font-space font-medium text-sm leading-5 tracking-[-0.4px] whitespace-nowrap ${
                  isActive ? "text-brand-accent" : "text-brand-muted"
                }`}>
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className={`flex flex-col px-4 py-4 gap-2 border-t border-t-[rgba(43,70,128,0.1)] w-full shrink-0 ${isCollapsed ? 'items-center' : 'items-start'}`}>
        {bottomItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={`flex flex-row items-center p-3 w-full transition-colors box-border rounded-md ${
                isActive 
                  ? 'bg-brand-active border-l-[4px] border-l-brand-accent' 
                  : 'border-l-[4px] border-l-transparent hover:bg-white/5'
              } ${isCollapsed ? 'justify-center w-12 h-12 p-0' : 'gap-4'}`}
            >
              <div className="flex flex-col items-center justify-center shrink-0">
                <item.icon 
                  size={20} 
                  className={isActive ? "text-brand-accent" : "text-brand-muted"} 
                  strokeWidth={2} 
                />
              </div>
              {!isCollapsed && (
                <span className={`font-space font-medium text-sm leading-5 tracking-[-0.4px] whitespace-nowrap ${
                  isActive ? "text-brand-accent" : "text-brand-muted"
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
