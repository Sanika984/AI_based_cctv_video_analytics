import React from 'react';
import { Shield, Info, ChevronRight, UserCircle, History, ShieldCheck } from 'lucide-react';

export default function Profile() {
   return (
      <div className="flex flex-col gap-10 w-full max-w-[1024px] animate-in fade-in transition-all pb-24">
         
         {/* Page Header */}
         <div className="flex flex-col gap-2 w-full">
            <h1 className="text-[30px] font-bold text-[#DEE5FF] tracking-[-0.75px] font-space leading-[36px]">
               Account Settings
            </h1>
            <p className="text-[#91AAEB] font-inter text-[16px] leading-[24px]">
               Manage your professional credentials and system security protocols.
            </p>
         </div>

         {/* Bento Grid Layout */}
         <div className="flex flex-col xl:flex-row gap-8 w-full">
            
            {/* Left Column */}
            <div className="flex flex-col flex-[2] gap-8 min-w-[632px]">
               
               {/* Profile Overview Card */}
               <div className="bg-[#06122D] border border-[rgba(43,70,128,0.05)] rounded-lg p-8 relative overflow-hidden flex flex-col gap-6 shadow-sm">
                  {/* Watermark Icon */}
                  <Shield 
                     size={180} 
                     className="absolute -right-6 -top-6 text-[#DEE5FF] opacity-5 rotate-12 pointer-events-none" 
                     strokeWidth={1}
                  />

                  {/* Top section: Avatar + Info */}
                  <div className="flex gap-8 relative z-10 w-full">
                     {/* Avatar Box */}
                     <div className="w-[128px] h-[128px] border-2 border-[rgba(78,222,163,0.2)] rounded-lg p-1 flex-shrink-0">
                        <div className="w-full h-full bg-[#05183C] rounded flex items-center justify-center relative overflow-hidden">
                           <UserCircle size={64} className="text-[#2B4680] absolute z-0" strokeWidth={1} />
                        </div>
                     </div>

                     {/* Details */}
                     <div className="flex flex-col flex-1">
                        <div className="flex flex-col mb-6">
                           <h2 className="text-[#DEE5FF] font-space font-bold text-[24px] leading-[32px]">Sarah Chen</h2>
                           <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[#91AAEB] font-inter text-[14px]">Employee ID:</span>
                              <span className="text-[#DEE5FF] font-mono text-[14px]">SL-9942-B</span>
                           </div>
                        </div>

                        {/* Detail Boxes */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                           <div className="bg-[#05183C] rounded-lg p-4 flex-1 flex flex-col justify-center gap-1">
                              <span className="text-[#91AAEB] font-inter text-[10px] tracking-[0.5px] uppercase">Email Address</span>
                              <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">s.chen@sentinel-analytics.ai</span>
                           </div>
                           <div className="bg-[#05183C] rounded-lg p-4 flex-1 flex flex-col justify-center gap-1">
                              <span className="text-[#91AAEB] font-inter text-[10px] tracking-[0.5px] uppercase">Direct Terminal</span>
                              <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">+1 (555) 012-9942</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* System Permissions Banner */}
                  <div className="bg-[#05183C] rounded-lg px-5 py-4 flex justify-between items-center relative z-10 mt-2 hover:bg-[#05183C]/80 transition-colors cursor-pointer">
                     <span className="text-[#91AAEB] font-inter text-[10px] tracking-[0.5px] uppercase">System Permissions</span>
                     <Info size={18} className="text-[#91AAEB]" />
                  </div>
               </div>

               {/* Activity Log / Allowed Cameras */}
               <div className="bg-[#05183C] border border-[rgba(43,70,128,0.05)] rounded-lg flex flex-col overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="px-8 py-6 border-b border-[rgba(43,70,128,0.05)] flex items-center gap-2">
                     <History size={18} className="text-[#FFB148]" />
                     <h3 className="text-[#DEE5FF] font-space font-bold text-[18px]">Allowed Cameras</h3>
                  </div>

                  {/* Table */}
                  <div className="flex flex-col w-full">
                     <div className="flex bg-[#06122D] px-8 py-4">
                        <div className="flex-[0.6] text-[#91AAEB] font-inter font-medium text-[10px] tracking-[1px] uppercase">Camera ID</div>
                        <div className="flex-1 text-[#91AAEB] font-inter font-medium text-[10px] tracking-[1px] uppercase pl-4">Location / Terminal</div>
                     </div>

                     <div className="flex bg-[#05183C] px-8 py-4 border-b border-[rgba(43,70,128,0.05)] hover:bg-black/10 transition-colors">
                        <div className="flex-[0.6] text-[#DEE5FF] font-inter text-[14px] flex items-center">CAM-0231</div>
                        <div className="flex-1 text-[#DEE5FF] font-inter text-[14px] pl-4">Station-04-A (Main Floor)</div>
                     </div>

                     <div className="flex bg-[#06122D] px-8 py-4 border-b border-[rgba(43,70,128,0.05)] hover:bg-[#05183C]/50 transition-colors">
                        <div className="flex-[0.6] text-[#DEE5FF] font-inter text-[14px] flex items-center">CAM-0284</div>
                        <div className="flex-1 text-[#DEE5FF] font-inter text-[14px] pl-4">Mobile Device (Admin App)</div>
                     </div>

                     <div className="flex bg-[#05183C] px-8 py-4 border-b border-[rgba(43,70,128,0.05)] hover:bg-black/10 transition-colors">
                        <div className="flex-[0.6] text-[#DEE5FF] font-inter text-[14px] flex items-center">CAM-1102</div>
                        <div className="flex-1 text-[#DEE5FF] font-inter text-[14px] pl-4">Remote API Gateway</div>
                     </div>

                     <div className="flex bg-[#06122D] px-8 py-4 hover:bg-[#05183C]/50 transition-colors">
                        <div className="flex-[0.6] text-[#DEE5FF] font-inter text-[14px] flex items-center">CAM-0099</div>
                        <div className="flex-1 text-[#DEE5FF] font-inter text-[14px] pl-4">System Core</div>
                     </div>
                  </div>
               </div>

            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6 w-[304px] flex-shrink-0">
               
               {/* Account Actions */}
               <div className="bg-[#05183C] border border-[rgba(43,70,128,0.05)] rounded-lg p-6 flex flex-col gap-6 shadow-sm">
                  <div className="flex items-center gap-2">
                     <ShieldCheck size={20} className="text-[#4EDEA3]" />
                     <span className="text-[#DEE5FF] font-space font-bold text-[18px]">Account Actions</span>
                  </div>

                  <button className="bg-[#031D4B] hover:bg-[#031D4B]/60 transition-colors rounded items-center justify-between flex px-4 py-3 w-full border border-transparent hover:border-[#2B4680]/50 shadow-sm">
                     <span className="text-[#DEE5FF] font-inter font-medium text-[14px]">Change Password</span>
                     <ChevronRight size={14} className="text-[#DEE5FF]" />
                  </button>
               </div>

               {/* Sign Out Card */}
               <div className="bg-[rgba(127,41,39,0.1)] border border-[rgba(127,41,39,0.2)] rounded-lg p-6 flex shadow-sm">
                  <button className="bg-[#EE7D77] hover:bg-[#EE7D77]/80 hover:scale-[0.98] transition-all rounded flex items-center justify-center w-full py-3 shadow-[0_4px_10px_rgba(238,125,119,0.1)]">
                     <span className="text-[#490106] font-inter font-bold text-[14px] tracking-[1.4px] uppercase">Sign Out</span>
                  </button>
               </div>

            </div>

         </div>
      </div>
   );
}
