import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCameras, getFootfall } from '../services/api';
import { ShieldAlert, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import FeedCard from '../components/FeedCard';
import AlertItem from '../components/AlertItem';

export default function LiveStream() {
   const { data: cameras, isLoading: isLoadingCameras } = useQuery({
      queryKey: ['cameras'],
      queryFn: getCameras,
   });

   const { data: footfalls, isLoading: isLoadingOccupancy } = useQuery({
      queryKey: ['footfall'],
      queryFn: getFootfall,
   });

   const activeCamerasCount = cameras?.filter(c => c.status?.toLowerCase() === 'online').length || 0;
   const totalCamerasCount = cameras?.length || 0;

   const [currentPage, setCurrentPage] = useState(0);
   const allCameras = cameras?.filter(c => c.status?.toLowerCase() === 'online') || [];
   const pageCount = Math.ceil(allCameras.length / 4);
   const displayedCameras = allCameras.slice(currentPage * 4, (currentPage + 1) * 4);

   const getLiveOccupancy = () => {
      if (!footfalls || footfalls.length === 0) return 0;
      return footfalls.slice(0, 5).reduce((acc, log) => acc + log.count, 0);
   };
   const liveOccupancy = getLiveOccupancy();

   return (
      <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1024px]">
         {/* Left Column */}
         <div className="flex flex-col flex-[2] gap-6 min-w-[632px]">

            {/* Secondary Data Row */}
            <div className="flex flex-row gap-6 w-full">
               <div className="bg-[#06122D] rounded-lg px-6 py-6 pb-10 flex-1 flex flex-col gap-2 relative shadow-sm">
                  <span className="text-[#91AAEB] font-inter font-semibold text-[12px] tracking-[0.6px]">ACTIVE CAMERAS</span>
                  <span className="text-[#DEE5FF] font-space font-bold text-[30px] leading-none mt-2">
                     {isLoadingCameras ? '...' : `${activeCamerasCount} / ${totalCamerasCount}`}
                  </span>
               </div>
               <div className="bg-[#06122D] rounded-lg px-6 py-6 pb-10 flex-1 flex flex-col gap-2 relative shadow-sm">
                  <span className="text-[#91AAEB] font-inter font-semibold text-[12px] tracking-[0.6px]">CURRENT OCCUPANCY</span>
                  <span className="text-[#DEE5FF] font-space font-bold text-[30px] leading-none mt-2">
                     {isLoadingOccupancy ? '...' : liveOccupancy}
                  </span>
               </div>
            </div>

            {/* Live Feeds Grid */}
            <div className="flex flex-col gap-4 w-full">
               <div className="grid grid-cols-2 gap-4 h-[362px]">
                  {isLoadingCameras ? (
                     <div className="col-span-2 flex items-center justify-center h-full">
                        <span className="text-[#91AAEB] font-inter">Loading cameras...</span>
                     </div>
                  ) : displayedCameras.length > 0 ? (
                     displayedCameras.map(camera => (
                        <FeedCard key={camera.camera_id} cameraId={camera.camera_id} title={camera.name} />
                     ))
                  ) : (
                     <div className="col-span-2 flex items-center justify-center h-full border border-dashed border-[rgba(43,70,128,0.3)] rounded-lg bg-[#06122D]">
                        <span className="text-[#91AAEB] font-inter">No cameras configured yet.</span>
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
