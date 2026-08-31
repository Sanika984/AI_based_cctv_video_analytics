import React, { useState } from 'react';
import FeedTab from './FeedTab';
import LogsTab from './LogsTab';
import BlacklistTab from './BlacklistTab';
import { Video, FileText, ShieldAlert } from 'lucide-react';

export default function LicensePlateDetection() {
  const [activeTab, setActiveTab] = useState('Feed');

  const tabConfigs = [
    { id: 'Feed', label: 'Live Feeds', icon: Video },
    { id: 'Logs', label: 'Detection Logs', icon: FileText },
    { id: 'Blacklist', label: 'Blacklist Management', icon: ShieldAlert },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] animate-in fade-in transition-all">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#DEE5FF] font-space uppercase tracking-wider flex items-center gap-2.5">
            <span className="text-[#4EDEA3]">ANPR</span> License Plate Analytics
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#06122D] p-1 rounded-lg border border-[rgba(43,70,128,0.2)]">
          {tabConfigs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-md text-[12px] font-inter font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#4EDEA3] text-[#004A31] shadow-sm font-bold'
                    : 'text-[#91AAEB] hover:text-[#DEE5FF]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area Rendering the Active Tab */}
      {activeTab === 'Feed' && <FeedTab />}
      {activeTab === 'Logs' && <LogsTab />}
      {activeTab === 'Blacklist' && <BlacklistTab />}
    </div>
  );
}
