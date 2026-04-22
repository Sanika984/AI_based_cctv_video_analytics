import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFootfall, getCameras } from '../../services/api';
import { Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import FeedCard from '../../components/FeedCard';

export default function InOutDashboard() {
   const { data: footfalls, isLoading } = useQuery({
      queryKey: ['footfall'],
      queryFn: getFootfall,
   });

   const { data: cameras, isLoading: isLoadingCameras } = useQuery({
      queryKey: ['cameras'],
      queryFn: getCameras,
   });

   const [currentPage, setCurrentPage] = useState(0);

   const filteredCameras = cameras?.filter(c => 
      c.module === 'Consumer Analytics' && c.features?.['IN / OUT count'] === true
   ) || [];
   
   const pageCount = Math.ceil(filteredCameras.length / 4);
   const displayedCameras = filteredCameras.slice(currentPage * 4, (currentPage + 1) * 4);

   // Derived mocked values based on API data
   const getLiveOccupancy = () => {
      if (!footfalls || footfalls.length === 0) return 0;
      // Get the sum of the last 5 logs for an arbitrary live occupancy reading
      return footfalls.slice(0, 5).reduce((acc, log) => acc + log.count, 0);
   };

   const getTotal = () => {
      if (!footfalls || footfalls.length === 0) return 0;
      return footfalls.reduce((acc, log) => acc + log.count, 0);
   };

   const liveOccupancy = getLiveOccupancy();
   const totalIn = getTotal();
   const totalOut = Math.floor(getTotal() * 0.72); // Mocking 72% out

   return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in transition-all">
         {/* Top Row: Video Grid & Occupancy Stats */}
         <div className="flex flex-col xl:flex-row gap-6 w-full">
            {/* Left: Video Grid */}
            <div className="flex flex-col gap-4 flex-[2] min-w-[632px]">
               <div className="grid grid-cols-2 gap-4 h-[400px]">
                  {isLoadingCameras ? (
                     <div className="col-span-2 flex items-center justify-center h-full">
                        <span className="text-[#91AAEB] font-inter">Loading cameras...</span>
                     </div>
                  ) : displayedCameras.length > 0 ? (
                     displayedCameras.map(camera => (
                        <FeedCard key={camera.camera_id} title={camera.name} />
                     ))
                  ) : (
                     <div className="col-span-2 flex items-center justify-center h-full border border-dashed border-[rgba(43,70,128,0.3)] rounded-lg bg-[#06122D]">
                        <span className="text-[#91AAEB] font-inter">No cameras configured for IN/OUT count.</span>
                     </div>
                  )}
               </div>

               {/* Pagination Controls */}
               {pageCount > 1 && (
                  <div className="flex justify-between items-center bg-[#06122D] p-3 rounded-lg border border-[rgba(43,70,128,0.1)]">
                     <span className="text-[#91AAEB] font-inter text-[12px]">Showing page {currentPage + 1} of {pageCount}</span>
                     <div className="flex gap-2">
                        <button 
                           onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                           disabled={currentPage === 0}
                           className="flex items-center gap-1 px-3 py-1.5 bg-[#05183C] text-[#DEE5FF] rounded hover:bg-[#4EDEA3] hover:text-[#004A31] transition-colors disabled:opacity-50 disabled:hover:bg-[#05183C] disabled:hover:text-[#DEE5FF]"
                        >
                           <ChevronLeft size={14} /> <span className="text-[12px] font-medium">Prev</span>
                        </button>
                        <button 
                           onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
                           disabled={currentPage >= pageCount - 1}
                           className="flex items-center gap-1 px-3 py-1.5 bg-[#05183C] text-[#DEE5FF] rounded hover:bg-[#4EDEA3] hover:text-[#004A31] transition-colors disabled:opacity-50 disabled:hover:bg-[#05183C] disabled:hover:text-[#DEE5FF]"
                        >
                           <span className="text-[12px] font-medium">Next</span> <ChevronRight size={14} />
                        </button>
                     </div>
                  </div>
               )}
            </div>

            {/* Right: Stats & Chart */}
            <div className="flex flex-col gap-6 flex-1 min-w-[304px]">
               {/* Live Occupancy */}
               <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[#91AAEB] font-space text-[12px] uppercase tracking-[1.2px]">Live Occupancy</span>
                     <Users size={16} className="text-[#4EDEA3]" />
                  </div>

                  <div className="flex items-end gap-3 pb-4 border-b border-[rgba(43,70,128,0.1)]">
                     <span className="text-[#DEE5FF] font-space font-bold text-[48px] leading-none">
                        {isLoading ? '...' : liveOccupancy}
                     </span>
                     {!isLoading && (
                        <div className="bg-[#4EDEA3]/10 px-2 py-0.5 rounded-[12px] mb-2 border border-[#4EDEA3]/20">
                           <span className="text-[#4EDEA3] font-inter font-medium text-[12px]">Normal Capacity</span>
                        </div>
                     )}
                  </div>

                  <div className="flex justify-between w-full pt-1">
                     <div className="flex flex-col gap-1 items-center">
                        <span className="text-[#91AAEB] font-inter text-[10px] uppercase">Total In</span>
                        <span className="text-[#DEE5FF] font-space text-[18px]">{isLoading ? '-' : totalIn.toLocaleString()}</span>
                     </div>
                     <div className="w-[1px] bg-[rgba(43,70,128,0.1)] h-full"></div>
                     <div className="flex flex-col gap-1 items-center">
                        <span className="text-[#91AAEB] font-inter text-[10px] uppercase">Total Out</span>
                        <span className="text-[#DEE5FF] font-space text-[18px]">{isLoading ? '-' : totalOut.toLocaleString()}</span>
                     </div>
                     <div className="w-[1px] bg-[rgba(43,70,128,0.1)] h-full"></div>
                     <div className="flex flex-col gap-1 items-center">
                        <span className="text-[#91AAEB] font-inter text-[10px] uppercase">Net Flow</span>
                        <span className="text-[#4EDEA3] font-space text-[18px]">+4.2%</span>
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

            {/* Floor Wise Count */}
            <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-6 flex-[1]">
               <span className="text-[#91AAEB] font-space text-[12px] uppercase tracking-[1.2px]">Floor Wise Count</span>

               <div className="flex flex-col gap-5 w-full">
                  {/* Row 1 */}
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between items-center">
                        <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">Floor 1 - Furniture</span>
                        <span className="text-[#4EDEA3] font-inter text-[12px]">High Traffic</span>
                     </div>
                     <div className="w-full bg-[#05183C] h-[8px] rounded-full relative overflow-hidden mt-1">
                        <div className="absolute left-0 top-0 bottom-0 w-[85%] bg-[#4EDEA3] rounded-full"></div>
                     </div>
                     <span className="text-[#91AAEB] font-inter text-[10px] mt-1">124 people/hr</span>
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
                     <span className="text-[#91AAEB] font-inter text-[10px] mt-1">88 people/hr</span>
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
                     <span className="text-[#91AAEB] font-inter text-[10px] mt-1">45 people/hr</span>
                  </div>

                  {/* Row 4 */}
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between items-center">
                        <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">Floor 0 - Checkout Zone</span>
                        <span className="text-[#EE7D77] font-inter text-[12px]">Bottleneck</span>
                     </div>
                     <div className="w-full bg-[#05183C] h-[8px] rounded-full relative overflow-hidden mt-1">
                        <div className="absolute left-0 top-0 bottom-0 w-[92%] bg-[#EE7D77] rounded-full"></div>
                     </div>
                     <span className="text-[#91AAEB] font-inter text-[10px] mt-1">156 people/hr</span>
                  </div>
               </div>
            </div>

            {/* Daily Performance Line Chart */}
            <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-4 flex-[1] relative overflow-hidden">
               <div className="flex flex-col gap-1 pt-2">
                  <h3 className="text-[#DEE5FF] font-space text-[18px]">Daily Performance Trends</h3>
                  <span className="text-[#91AAEB] font-inter text-[12px]">Comparing Entry vs Exit volume across all nodes</span>
               </div>

               <div className="flex gap-2 mt-4">
                  <button className="bg-[#031D4B] border border-[rgba(43,70,128,0.2)] text-[#DEE5FF] px-4 py-[6px] rounded-[12px] text-[12px] font-medium">Today</button>
                  <button className="text-[#91AAEB] px-4 py-[6px] text-[12px] font-medium hover:text-[#DEE5FF]">Weekly</button>
                  <button className="text-[#91AAEB] px-4 py-[6px] text-[12px] font-medium hover:text-[#DEE5FF]">Monthly</button>
               </div>

               {/* Chart SVG wrapper */}
               <div className="mt-8 flex-1 w-full relative min-h-[140px] flex items-center justify-center">
                  {/* Basic SVG recreation of the curvy line graph */}
                  <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" className="overflow-visible">

                     {/* Grid lines */}
                     <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(43,70,128,0.1)" strokeWidth="1" />
                     <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(43,70,128,0.1)" strokeWidth="1" />
                     <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(43,70,128,0.1)" strokeWidth="1" />

                     {/* The curved line */}
                     <path d="M 0 100 C 60 100, 80 40, 140 40 C 180 40, 200 100, 240 100 C 270 100, 270 -10, 310 -10 C 330 -10, 340 120, 360 120 C 380 120, 390 20, 400 20"
                        fill="none" stroke="#EE7D77" strokeWidth="3" strokeLinecap="round" />

                     {/* Data Points */}
                     <circle cx="310" cy="-10" r="4" fill="#4EDEA3" />
                     <circle cx="400" cy="20" r="4" fill="#4EDEA3" />
                  </svg>

                  {/* Tooltip mockup */}
                  <div className="absolute top-[4px] left-[254px] bg-[#00225A]/80 backdrop-blur-md border border-[#4EDEA3]/20 p-2 rounded shadow-lg flex flex-col pointer-events-none">
                     <span className="text-[#91AAEB] text-[9px] uppercase font-bold">15:00 PEAK</span>
                     <span className="text-[#4EDEA3] text-[14px] font-space mt-0.5">156 In</span>
                  </div>
               </div>

               {/* Legend */}
               <div className="flex justify-center items-center gap-2 mt-4 pb-2">
                  <div className="w-8 h-[4px] bg-[#EE7D77] rounded-full"></div>
                  <span className="text-[#91AAEB] font-inter text-[10px] uppercase font-medium tracking-[1px]">Customer Entries</span>
               </div>
            </div>

         </div>
      </div>
   )
}
