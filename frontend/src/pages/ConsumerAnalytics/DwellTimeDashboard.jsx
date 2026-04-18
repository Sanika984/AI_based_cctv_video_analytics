import React from 'react';
import { Users, Clock } from 'lucide-react';
import FeedCard from '../../components/FeedCard';

export default function DwellTimeDashboard() {
   return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in transition-all">

         {/* Top Row: Video Grid & Occupancy Stats */}
         <div className="flex flex-col xl:flex-row gap-6 w-full">
            {/* Left: Video Grid */}
            <div className="grid grid-cols-2 gap-4 flex-[2] min-w-[632px] h-[400px]">
               <FeedCard title="CAM-01: GROCERIES" />
               <FeedCard title="CAM-02: MILK & DAIRY" />
               <FeedCard title="CAM-03: ELECTRONICS" />
               <FeedCard title="CAM-04: STATIONARY" />
            </div>

            {/* Right: Stats & Chart */}
            <div className="flex flex-col gap-6 flex-1 min-w-[304px]">
               {/* Average Dwell Time */}
               <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[#91AAEB] font-space text-[12px] uppercase tracking-[1.2px]">Average Dwell Time</span>
                     <Users size={16} className="text-[#4EDEA3]" />
                  </div>

                  <div className="flex items-end gap-3 pb-2 pt-2">
                     <span className="text-[#DEE5FF] font-space font-bold text-[56px] leading-[1]">12.2</span>
                     <div className="mb-2">
                        <span className="text-[#91AAEB] font-space font-medium text-[12px] uppercase tracking-[1.2px]">MIN</span>
                     </div>
                  </div>
               </div>

               {/* Peak Hours Chart Container */}
               <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[#91AAEB] font-space text-[12px] uppercase tracking-[1.2px]">Peak Hours Today</span>
                     <Clock size={16} className="text-[#8F9FB7]" />
                  </div>

                  {/* Stylized Bar Chart */}
                  <div className="flex items-end justify-between h-[80px] w-full pt-4">
                     <div className="w-[28px] h-[30px] bg-[#05183C] rounded-t-sm"></div>
                     <div className="w-[28px] h-[45px] bg-[#05183C] rounded-t-sm"></div>
                     <div className="w-[28px] h-[76px] bg-[#05183C] rounded-t-sm"></div>

                     {/* Highlight active peak */}
                     <div className="w-[28px] h-[100%] bg-[#5B74B1] rounded-t-sm relative shadow-[0_0_10px_rgba(78,222,163,0.3)]">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-white/20 rounded-t-sm"></div>
                     </div>

                     <div className="w-[28px] h-[90%] bg-[#4EDEA3] rounded-t-sm"></div>

                     <div className="w-[28px] h-[70px] bg-[#05183C] rounded-t-sm"></div>
                     <div className="w-[28px] h-[51px] bg-[#05183C] rounded-t-sm"></div>

                     <div className="w-[28px] h-[86px] bg-[#F8A010] rounded-t-sm"></div>
                     <div className="w-[28px] h-[57px] bg-[#05183C] rounded-t-sm"></div>
                  </div>

                  {/* X-Axis */}
                  <div className="flex justify-between w-full mt-2">
                     <span className="font-mono text-[10px] text-[#91AAEB]">08:00</span>
                     <span className="font-mono text-[10px] text-[#91AAEB] pl-6">12:00</span>
                     <span className="font-mono text-[10px] text-[#91AAEB] pr-6">18:00</span>
                     <span className="font-mono text-[10px] text-[#91AAEB]">22:00</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Bottom Row: Floor Stats & Line Chart */}
         <div className="flex flex-col xl:flex-row gap-6 w-full">

            {/* Average Dwell Time (Floor Wise) */}
            <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-6 flex-[1]">
               <span className="text-[#91AAEB] font-space text-[12px] uppercase tracking-[1.2px]">Average Dwell Time</span>

               {/* Toggles */}
               <div className="flex bg-[#162C5D] p-1 rounded-lg w-max mt-[-8px]">
                  <button className="px-5 py-1.5 text-[12px] font-inter text-[#DEE5FF] rounded hover:bg-white/5 transition-colors uppercase tracking-[0.5px]">
                     INDIVIDUAL
                  </button>
                  <button className="px-4 py-1.5 text-[12px] font-inter bg-[#4EDEA3] text-[#020617] rounded shadow uppercase font-medium tracking-[0.5px]">
                     FLOOR WISE
                  </button>
               </div>

               <div className="flex flex-col gap-5 w-full mt-2">
                  {/* Row 1 */}
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between items-center">
                        <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">Floor 1 - Furniture</span>
                        <span className="text-[#4EDEA3] font-inter text-[12px]">High</span>
                     </div>
                     <div className="w-full bg-[#05183C] h-[8px] rounded-full relative overflow-hidden mt-1">
                        <div className="absolute left-0 top-0 bottom-0 w-[85%] bg-[#4EDEA3] rounded-full"></div>
                     </div>
                     <div className="flex justify-between w-full mt-1">
                        <span className="text-[#91AAEB] font-inter text-[10px]">12 min</span>
                        <span className="text-[#91AAEB] font-inter text-[10px]">10 Cameras</span>
                     </div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between items-center">
                        <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">Floor 2 - Home Appliances</span>
                        <span className="text-[#FFB148] font-inter text-[12px]">Medium</span>
                     </div>
                     <div className="w-full bg-[#05183C] h-[8px] rounded-full relative overflow-hidden mt-1">
                        <div className="absolute left-0 top-0 bottom-0 w-[62%] bg-[#FFB148] rounded-full"></div>
                     </div>
                     <div className="flex justify-between w-full mt-1">
                        <span className="text-[#91AAEB] font-inter text-[10px]">10 min</span>
                        <span className="text-[#91AAEB] font-inter text-[10px]">4 Cameras</span>
                     </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between items-center">
                        <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">Floor 3 - Clothing</span>
                        <span className="text-[#91AAEB] font-inter text-[12px]">Normal</span>
                     </div>
                     <div className="w-full bg-[#05183C] h-[8px] rounded-full relative overflow-hidden mt-1">
                        <div className="absolute left-0 top-0 bottom-0 w-[38%] bg-[#5B74B1] rounded-full"></div>
                     </div>
                     <div className="flex justify-between w-full mt-1">
                        <span className="text-[#91AAEB] font-inter text-[10px]">7 min</span>
                        <span className="text-[#91AAEB] font-inter text-[10px]">6 Cameras</span>
                     </div>
                  </div>

                  {/* Row 4 */}
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between items-center">
                        <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">Floor 0 - Checkout Zone</span>
                        <span className="text-[#EE7D77] font-inter text-[12px]">Very High</span>
                     </div>
                     <div className="w-full bg-[#05183C] h-[8px] rounded-full relative overflow-hidden mt-1">
                        <div className="absolute left-0 top-0 bottom-0 w-[92%] bg-[#EE7D77] rounded-full"></div>
                     </div>
                     <div className="flex justify-between w-full mt-1">
                        <span className="text-[#91AAEB] font-inter text-[10px]">15 min</span>
                        <span className="text-[#91AAEB] font-inter text-[10px]">5 Cameras</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Daily Performance Line Chart */}
            <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-4 flex-[1] relative overflow-hidden">
               <div className="flex flex-col gap-1 pt-2">
                  <h3 className="text-[#DEE5FF] font-space text-[18px]">Daily Performance Trends</h3>
                  <span className="text-[#91AAEB] font-inter text-[12px]">Comparing average dwell time across all nodes</span>
               </div>

               <div className="flex gap-2 mt-4">
                  <button className="bg-[#031D4B] border border-[rgba(43,70,128,0.2)] text-[#DEE5FF] px-4 py-[6px] rounded-[12px] text-[12px] font-medium">Today</button>
                  <button className="text-[#91AAEB] px-4 py-[6px] text-[12px] font-medium hover:text-[#DEE5FF]">Weekly</button>
                  <button className="text-[#91AAEB] px-4 py-[6px] text-[12px] font-medium hover:text-[#DEE5FF]">Monthly</button>
               </div>

               {/* Chart SVG wrapper */}
               <div className="mt-8 flex-1 w-full relative min-h-[140px] flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" className="overflow-visible">

                     {/* Grid lines */}
                     <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(43,70,128,0.1)" strokeWidth="1" />
                     <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(43,70,128,0.1)" strokeWidth="1" />
                     <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(43,70,128,0.1)" strokeWidth="1" />

                     {/* The curved line */}
                     <path d="M 0 100 C 60 100, 80 40, 140 40 C 180 40, 200 100, 240 100 C 270 100, 270 -10, 310 -10 C 330 -10, 340 120, 360 120 C 380 120, 390 20, 400 20"
                        fill="none" stroke="#4EDEA3" strokeWidth="3" strokeLinecap="round" />

                     {/* Data Points */}
                     <circle cx="310" cy="-10" r="4" fill="#DEE5FF" />
                     <circle cx="400" cy="20" r="4" fill="#DEE5FF" />
                  </svg>

                  {/* Tooltip mockup */}
                  <div className="absolute top-[4px] left-[254px] bg-[#00225A]/80 backdrop-blur-md border border-[#4EDEA3]/20 p-2 rounded shadow-lg flex flex-col pointer-events-none">
                     <span className="text-[#91AAEB] text-[9px] uppercase font-bold">15:00 PEAK</span>
                     <span className="text-[#4EDEA3] text-[14px] font-space mt-0.5">15 min</span>
                  </div>
               </div>

               {/* Legend */}
               <div className="flex justify-center items-center gap-2 mt-4 pb-2">
                  <div className="w-8 h-[4px] bg-[#4EDEA3] rounded-full"></div>
                  <span className="text-[#91AAEB] font-inter text-[10px] uppercase font-medium tracking-[1px]">DWELL TIME</span>
               </div>
            </div>

         </div>
      </div>
   )
}
