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