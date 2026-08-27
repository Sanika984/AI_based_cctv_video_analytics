import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import {
  LiveStream,
  ConsumerAnalytics,
  LicensePlateDetection,
  SecurityAlerts,
  CameraConfig,
  UserManagement,
  Profile,
  Support,
  Logs,
  Login
} from './pages';

// Layout component to handle the sidebar and main content area for authenticated views
function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-brand-bg flex text-brand-muted font-space overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} />

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} flex flex-col h-screen`}>

        {/* Top Header */}
        <header className="mb-4 flex-shrink-0 flex justify-between items-center px-8 pt-6">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-brand-sub hover:text-brand-text transition-colors cursor-pointer p-1 rounded-md hover:bg-white/5"
            title="Toggle Sidebar"
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
            <Route 
              path="/config" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CameraConfig />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="/support" element={<Support />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;