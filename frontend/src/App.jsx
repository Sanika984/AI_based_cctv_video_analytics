import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Bell, Settings, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import { 
  LiveStream, 
  ConsumerAnalytics, 
  LicensePlateDetection, 
  SecurityAlerts, 
  CameraConfig, 
  Profile, 
  Support, 
  Logs 
} from './pages';

// We create a layout component to handle the sidebar and main content area
function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg flex text-brand-muted font-space overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} />

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col h-screen`}>
        
        {/* Top Header */}
        <header className="mb-8 flex-shrink-0 flex justify-between items-center px-8 pt-6">
          <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="text-brand-sub hover:text-brand-text transition-colors"
          >
             <Menu size={24} strokeWidth={2} />
          </button>

          <div className="flex items-center gap-5 text-brand-sub">
            <button className="hover:text-brand-text transition-colors relative">
               <span className="absolute -top-0.5 -right-0.5 w-[6px] h-[6px] bg-[#EE7D77] rounded-full border border-brand-bg"></span>
               <Bell size={20} strokeWidth={2}/>
            </button>
            <button className="hover:text-brand-text transition-colors">
               <Settings size={20} strokeWidth={2}/>
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden ml-2 border border-[rgba(43,70,128,0.3)]">
               <img src="https://i.pravatar.cc/150?img=47" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content injected by Router */}
        <div className="flex-1 overflow-auto rounded-xl scrollbar-hide px-8 pb-8">
          <Routes>
            <Route path="/" element={<LiveStream />} />
            <Route path="/analytics" element={<ConsumerAnalytics />} />
            <Route path="/vehicles" element={<LicensePlateDetection />} />
            <Route path="/alerts" element={<SecurityAlerts />} />
            <Route path="/config" element={<CameraConfig />} />
            <Route path="/profile" element={<Profile />} />
            
            <Route path="/support" element={<Support />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <DashboardLayout />
    </Router>
  );
}

export default App;