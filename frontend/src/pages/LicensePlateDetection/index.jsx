import React, { useState } from 'react';
import FeedTab from './FeedTab';
import BlacklistTab from './BlacklistTab';

export default function LicensePlateDetection() {
   const [activeTab, setActiveTab] = useState('Blacklist'); // Made 'Blacklist' active for dev display

   return (
      <div className="flex flex-col gap-8 w-full max-w-[1024px]">
         {/* Page Header Area */}
         <div className="flex items-center gap-8 w-full mb-1">
            <h1 className="text-[20px] font-bold text-[#DEE5FF] tracking-[-0.75px] font-space">License Plate Detection</h1>
            <div className="flex items-center gap-4">
               {['Feed', 'Logs', 'Blacklist'].map((tab) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`px-4 py-1.5 rounded-[6px] text-[14px] font-inter transition-colors ${
                        activeTab === tab 
                        ? 'bg-[#4EDEA3] text-[#004A31] font-bold' 
                        : 'text-[#91AAEB] hover:text-[#DEE5FF]'
                     }`}
                  >
                     {tab}
                  </button>
               ))}
            </div>
         </div>

         {/* Content Area Rendering the Active Tab */}
         {activeTab === 'Feed' && <FeedTab />}
         {activeTab === 'Blacklist' && <BlacklistTab />}
         {activeTab === 'Logs' && (
            <div className="flex items-center justify-center w-full h-[400px] border border-[rgba(43,70,128,0.3)] bg-[#05183C]/20 rounded-xl border-dashed">
               <span className="text-[#91AAEB] text-[14px] tracking-widest uppercase">Logs view coming soon</span>
            </div>
         )}
      </div>
   );
}
