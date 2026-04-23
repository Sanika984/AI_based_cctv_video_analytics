import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCameras, getInOutSummary, getFloorWiseStats, getHourlyStats } from '../../services/api';
import { Users, Clock, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import FeedCard from '../../components/FeedCard';

export default function InOutDashboard() {
   const { data: summary, isLoading: isLoadingSummary } = useQuery({
      queryKey: ['in-out-summary'],
      queryFn: getInOutSummary,
      refetchInterval: 5000,
   });

   const { data: floorStats, isLoading: isLoadingFloors } = useQuery({
      queryKey: ['floor-wise-stats'],
      queryFn: getFloorWiseStats,
      refetchInterval: 10000,
   });

   const { data: hourlyStats, isLoading: isLoadingHourly } = useQuery({
      queryKey: ['hourly-stats'],
      queryFn: getHourlyStats,
   });

   const { data: cameras, isLoading: isLoadingCameras } = useQuery({
      queryKey: ['cameras'],
      queryFn: getCameras,
   });

   const [currentPage, setCurrentPage] = useState(0);

   const filteredCameras = cameras?.filter(c => 
      c.status?.toLowerCase() === 'online' &&
      c.module === 'Consumer Analytics' && 
      c.features?.['IN / OUT count'] === true
   ) || [];
   
   const pageCount = Math.ceil(filteredCameras.length / 4);
   const displayedCameras = filteredCameras.slice(currentPage * 4, (currentPage + 1) * 4);

   // Calculate peak hour from hourly data
   const peakData = hourlyStats?.reduce((prev, current) => (prev.in_count > current.in_count) ? prev : current, {hour: '00:00', in_count: 0});

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
                        <FeedCard key={camera.camera_id} title={camera.name} cameraId={camera.camera_id} />
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
                     <span className="text-[#91AAEB] font-space text-[12px] uppercase tracking-[1.2px]">Total Store Occupancy</span>
                     <Users size={16} className="text-[#4EDEA3]" />
                  </div>

                  <div className="flex items-end gap-3 pb-4 border-b border-[rgba(43,70,128,0.1)]">
                     <span className="text-[#DEE5FF] font-space font-bold text-[48px] leading-none">
                        {isLoadingSummary ? '...' : summary?.live_occupancy}
                     </span>
                     {!isLoadingSummary && (
                        <div className="bg-[#4EDEA3]/10 px-2 py-0.5 rounded-[12px] mb-2 border border-[#4EDEA3]/20">
                           <span className="text-[#4EDEA3] font-inter font-medium text-[12px]">Real-time</span>
                        </div>
                     )}
                  </div>

                  <div className="flex justify-between w-full pt-1">
                     <div className="flex flex-col gap-1 items-center">
                        <span className="text-[#91AAEB] font-inter text-[10px] uppercase text-center">Net In</span>
                        <span className="text-[#DEE5FF] font-space text-[18px]">{isLoadingSummary ? '-' : summary?.total_in.toLocaleString()}</span>
                     </div>
                     <div className="w-[1px] bg-[rgba(43,70,128,0.1)] h-full"></div>
                     <div className="flex flex-col gap-1 items-center">
                        <span className="text-[#91AAEB] font-inter text-[10px] uppercase text-center">Net Out</span>
                        <span className="text-[#DEE5FF] font-space text-[18px]">{isLoadingSummary ? '-' : summary?.total_out.toLocaleString()}</span>
                     </div>
                     <div className="w-[1px] bg-[rgba(43,70,128,0.1)] h-full"></div>
                     <div className="flex flex-col gap-1 items-center">
                        <span className="text-[#91AAEB] font-inter text-[10px] uppercase text-center">Net Flow</span>
                        <div className="flex items-center gap-1">
                            {summary?.net_flow_pct >= 0 ? <TrendingUp size={12} className="text-[#4EDEA3]" /> : <TrendingDown size={12} className="text-[#EE7D77]" />}
                            <span className={summary?.net_flow_pct >= 0 ? "text-[#4EDEA3] font-space text-[18px]" : "text-[#EE7D77] font-space text-[18px]"}>
                                {isLoadingSummary ? '-' : `${summary?.net_flow_pct > 0 ? '+' : ''}${summary?.net_flow_pct}%`}
                            </span>
                        </div>
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
                  <div className="flex items-end justify-between h-[80px] w-full pt-4 gap-1">
                     {isLoadingHourly ? (
                        <div className="w-full flex items-center justify-center">
                            <span className="text-[#91AAEB] text-[10px]">Loading trends...</span>
                        </div>
                     ) : hourlyStats?.map((stat, idx) => {
                        const maxIn = Math.max(...hourlyStats.map(s => s.in_count), 1);
                        const heightPct = (stat.in_count / maxIn) * 100;
                        const isPeak = stat.hour === peakData?.hour;
                        
                        return (
                            <div 
                                key={idx} 
                                className={`flex-1 rounded-t-sm transition-all duration-500 ${isPeak ? 'bg-[#4EDEA3] shadow-[0_0_10px_rgba(78,222,163,0.3)]' : 'bg-[#05183C] hover:bg-[#5B74B1]'}`}
                                style={{ height: `${Math.max(10, heightPct)}%` }}
                                title={`${stat.hour}: ${stat.in_count} in`}
                            >
                                {isPeak && <div className="absolute top-0 right-0 left-0 h-0.5 bg-white/20 rounded-t-sm"></div>}
                            </div>
                        )
                     })}
                  </div>

                  {/* X-Axis */}
                  <div className="flex justify-between w-full mt-2">
                     <span className="font-mono text-[10px] text-[#91AAEB]">00:00</span>
                     <span className="font-mono text-[10px] text-[#91AAEB]">12:00</span>
                     <span className="font-mono text-[10px] text-[#91AAEB]">23:00</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Bottom Row: Floor Stats & Line Chart */}
         <div className="flex flex-col xl:flex-row gap-6 w-full">

            {/* Floor Wise Count */}
            <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-6 flex-[1]">
               <span className="text-[#91AAEB] font-space text-[12px] uppercase tracking-[1.2px]">Floor Wise Occupancy</span>

               <div className="flex flex-col gap-5 w-full max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {isLoadingFloors ? (
                     <span className="text-[#91AAEB] font-inter text-[12px]">Loading floors...</span>
                  ) : floorStats?.length > 0 ? (
                     floorStats.map((floor, idx) => (
                        <div key={idx} className="flex flex-col gap-1 w-full">
                           <div className="flex justify-between items-center">
                              <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">{floor.floor}</span>
                              <span className={`font-inter text-[12px] ${
                                 floor.status === 'High Traffic' ? 'text-[#EE7D77]' : 
                                 floor.status === 'Normal' ? 'text-[#4EDEA3]' : 'text-[#91AAEB]'
                              }`}>{floor.status}</span>
                           </div>
                           <div className="w-full bg-[#05183C] h-[8px] rounded-full relative overflow-hidden mt-1">
                              <div 
                                 className="absolute left-0 top-0 bottom-0 bg-[#4EDEA3] rounded-full transition-all duration-1000"
                                 style={{ 
                                    width: `${floor.percentage}%`,
                                    backgroundColor: floor.status === 'High Traffic' ? '#EE7D77' : floor.status === 'Normal' ? '#4EDEA3' : '#5B74B1'
                                 }}
                              ></div>
                           </div>
                           <div className="flex justify-between mt-1">
                                <span className="text-[#91AAEB] font-inter text-[10px] uppercase font-bold tracking-wider">{floor.occupancy} current occupancy</span>
                                <span className="text-[#91AAEB] font-inter text-[10px]">{floor.in_count} entries today</span>
                           </div>
                        </div>
                     ))
                  ) : (
                    <span className="text-[#91AAEB] font-inter text-[12px]">No floor data available.</span>
                  )}
               </div>
            </div>

            {/* Daily Performance Line Chart */}
            <div className="bg-[#06122D] rounded-lg p-6 flex flex-col gap-4 flex-[1] relative overflow-hidden">
               <div className="flex flex-col gap-1 pt-2">
                  <h3 className="text-[#DEE5FF] font-space text-[18px]">Daily Performance Trends</h3>
                  <span className="text-[#91AAEB] font-inter text-[12px]">Comparing hourly customer entry volume across all nodes</span>
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

                     {/* The dynamic curved line based on hourlyStats */}
                     {!isLoadingHourly && hourlyStats?.length > 1 && (
                        <path 
                           d={"M " + hourlyStats.map((s, i) => {
                              const x = (i / (hourlyStats.length - 1)) * 400;
                              const maxIn = Math.max(...hourlyStats.map(st => st.in_count), 1);
                              const y = 110 - (s.in_count / maxIn * 100);
                              return `${x} ${y}`;
                           }).join(" L ")}
                           fill="none" 
                           stroke="#4EDEA3" 
                           strokeWidth="3" 
                           strokeLinecap="round" 
                           className="transition-all duration-1000"
                        />
                     )}

                     {/* Peak Point Decoration */}
                     {!isLoadingHourly && peakData && (
                        <circle 
                            cx={(hourlyStats.findIndex(s => s.hour === peakData.hour) / (hourlyStats.length - 1)) * 400} 
                            cy={110 - (peakData.in_count / Math.max(...hourlyStats.map(st => st.in_count), 1) * 100)} 
                            r="4" 
                            fill="#4EDEA3" 
                            className="animate-pulse"
                        />
                     )}
                  </svg>

                  {/* Tooltip mockup for Peak */}
                  {!isLoadingHourly && peakData && peakData.in_count > 0 && (
                     <div 
                        className="absolute bg-[#00225A]/80 backdrop-blur-md border border-[#4EDEA3]/20 p-2 rounded shadow-lg flex flex-col pointer-events-none"
                        style={{
                            left: `${(hourlyStats.findIndex(s => s.hour === peakData.hour) / (hourlyStats.length - 1)) * 100}%`,
                            top: `${110 - (peakData.in_count / Math.max(...hourlyStats.map(st => st.in_count), 1) * 100) - 40}px`,
                            transform: 'translateX(-50%)'
                        }}
                     >
                        <span className="text-[#91AAEB] text-[9px] uppercase font-bold">{peakData.hour} PEAK</span>
                        <span className="text-[#4EDEA3] text-[14px] font-space mt-0.5">{peakData.in_count} In</span>
                     </div>
                  )}
               </div>

               {/* Legend */}
               <div className="flex justify-center items-center gap-2 mt-4 pb-2">
                  <div className="w-8 h-[4px] bg-[#4EDEA3] rounded-full"></div>
                  <span className="text-[#91AAEB] font-inter text-[10px] uppercase font-medium tracking-[1px]">Customer Entries</span>
               </div>
            </div>

         </div>
      </div>
   )
}
