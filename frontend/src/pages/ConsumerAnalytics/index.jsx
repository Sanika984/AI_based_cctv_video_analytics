import React, { useState } from 'react';
import InOutDashboard from './InOutDashboard';
import DwellTimeDashboard from './DwellTimeDashboard';

export default function ConsumerAnalytics() {
   const [activeTab, setActiveTab] = useState('IN / OUT');

   return (
      <div className="flex flex-col gap-8 w-full max-w-[1024px]">
         {/* Header specific to Consumer Analytics */}
         <div className="flex justify-between items-center w-full">
            <h2 className="text-[20px] font-bold text-brand-text font-space">Consumer Analytics</h2>

            <div className="bg-[#05183C] p-1 rounded-lg flex items-center border border-[rgba(43,70,128,0.3)]">
               {['IN / OUT', 'Dwell Time', 'Heatmap'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-4 py-1.5 rounded-md text-sm font-inter transition-colors ${activeTab === tab
                           ? 'bg-[#4EDEA3] text-[#020617] font-semibold'
                           : 'text-[#91AAEB] hover:text-[#DEE5FF]'
                        }`}
                  >
                     {tab}
                  </button>
               ))}
            </div>
         </div>

         {activeTab === 'IN / OUT' && <InOutDashboard />}
         {activeTab === 'Dwell Time' && <DwellTimeDashboard />}
         {activeTab === 'Heatmap' && <Placeholder desc="Heatmap visualizations coming soon." />}
      </div>
   );
}

function Placeholder({ desc }) {
   return (
      <div className="w-full h-[400px] flex items-center justify-center border border-[rgba(43,70,128,0.3)] bg-[#05183C]/20 rounded-xl border-dashed">
         <span className="text-brand-sub text-sm tracking-widest uppercase">{desc}</span>
      </div>
   );
}
