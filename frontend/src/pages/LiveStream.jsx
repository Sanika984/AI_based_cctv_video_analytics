import React from 'react';
import { ShieldAlert, Users, CheckCircle, Store } from 'lucide-react';
import FeedCard from '../components/FeedCard';
import AlertItem from '../components/AlertItem';

export default function LiveStream() {
   return (
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1024px]">
         {/* Left Column */}
         <div className="flex flex-col flex-[2] gap-6 min-w-[632px]">

            {/* Secondary Data Row */}
            <div className="flex flex-row gap-6 w-full">
               <div className="bg-[#06122D] rounded-lg px-6 py-6 pb-10 flex-1 flex flex-col gap-2 relative">
                  <span className="text-[#91AAEB] font-inter font-semibold text-[12px] tracking-[0.6px]">ACTIVE CAMERAS</span>
                  <span className="text-[#DEE5FF] font-space font-bold text-[30px] leading-none mt-2">12 / 15</span>
               </div>
               <div className="bg-[#06122D] rounded-lg px-6 py-6 pb-10 flex-1 flex flex-col gap-2 relative">
                  <span className="text-[#91AAEB] font-inter font-semibold text-[12px] tracking-[0.6px]">CURRENT OCCUPANCY</span>
                  <span className="text-[#DEE5FF] font-space font-bold text-[30px] leading-none mt-2">240</span>
               </div>
            </div>

            {/* Live Feeds Grid */}
            <div className="grid grid-cols-2 gap-4 w-full h-[362px]">
               <FeedCard title="CAM-01: FRONT ENTRANCE" />
               <FeedCard title="CAM-04: CHECKOUT" />
               <FeedCard title="CAM-12: AISLE 3" />
               <FeedCard title="CAM-18: PARKING LOT" />
            </div>
         </div>

         {/* Right Column */}
         <div className="flex flex-col gap-6 w-[304px] flex-shrink-0">

            {/* Supermarket Details */}
            <div className="bg-[#05183C] border border-[rgba(43,70,128,0.1)] rounded-lg p-6 flex flex-col shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
               <div className="flex justify-between items-start mb-6 w-full relative z-10">
                  <div className="flex w-full justify-between items-start">
                     <div className="flex flex-col gap-1">
                        <h3 className="text-[#DEE5FF] font-space font-bold text-[18px] leading-[28px] max-w-[180px]">Node 04 - Metropolis Central</h3>
                        <p className="text-[#91AAEB] font-inter text-[14px]">884 Tech Boulevard, Floor 1</p>
                     </div>
                     <div className="bg-[#4EDEA3]/10 p-2 rounded-md shrink-0">
                        <Store className="text-[#4EDEA3]" size={18} strokeWidth={2} />
                     </div>
                  </div>
               </div>

               <div className="border-b border-[rgba(43,70,128,0.1)] py-3 flex justify-between relative z-10">
                  <span className="text-[#91AAEB] font-inter text-[12px]">User</span>
                  <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">Jameson</span>
               </div>
               <div className="border-b border-[rgba(43,70,128,0.1)] py-3 flex justify-between relative z-10">
                  <span className="text-[#91AAEB] font-inter text-[12px]">Active Terminals</span>
                  <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">12 / 12</span>
               </div>
               <div className="py-3 flex justify-between relative z-10">
                  <span className="text-[#91AAEB] font-inter text-[12px]">Edge Uplink</span>
                  <span className="text-[#4EDEA3] font-inter font-medium text-[14px]">842 Mbps</span>
               </div>
            </div>

            {/* Live Alerts Log */}
            <div className="bg-black/50 rounded-lg flex flex-col h-[400px]">
               <div className="bg-[#05183C] px-4 py-3 rounded-t-lg flex justify-between items-center border border-[rgba(43,70,128,0.1)] border-b-0">
                  <div className="flex items-center gap-2">
                     <ShieldAlert size={14} className="text-[#EE7D77]" />
                     <span className="text-[#DEE5FF] font-inter font-bold text-[12px] tracking-[1.2px]">LIVE ALERTS LOG</span>
                  </div>
                  <span className="text-[#4EDEA3] font-inter text-[10px] cursor-pointer hover:underline">View All</span>
               </div>

               <div className="p-2 flex flex-col gap-2 overflow-auto bg-[#020617] border-x border-b border-[rgba(43,70,128,0.1)] rounded-b-lg flex-1">
                  <AlertItem
                     type="error"
                     title="UNAUTHORIZED ACCESS"
                     time="14:24:02"
                     desc="Motion detected in Zone B Loading Dock after-hours perimeter lock."
                  />
                  <AlertItem
                     type="warn"
                     title="QUEUE OVERFLOW"
                     time="14:20:15"
                     desc="Checkout A cluster exceeding 5 person limit. Requesting additional terminal."
                  />
                  <AlertItem
                     type="success"
                     title="SYSTEM RECOVERY"
                     time="13:58:22"
                     desc="CAM-18 North Parking Lot connection re-established. Syncing logs..."
                  />
               </div>
            </div>

         </div>
      </div>
   );
}
