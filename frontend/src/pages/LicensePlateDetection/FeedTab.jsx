
import React from 'react';
import { Camera, Maximize, Image as ImageIcon, ShieldAlert } from 'lucide-react';

export default function FeedTab() {
   return (
      <div className="flex flex-col xl:flex-row gap-6 w-full animate-in fade-in transition-all">
         {/* Left Column */}
         <div className="flex flex-col flex-[2] gap-6 min-w-[632px]">
            {/* Stats Bar */}
            <div className="flex gap-6 w-full">
               <div className="bg-[#06122D] rounded-lg p-4 px-6 flex-1 h-[71px] flex flex-col justify-center border border-[rgba(43,70,128,0.1)] shadow-sm">
                  <span className="text-[#91AAEB] font-inter font-semibold text-[10px] tracking-[1px] uppercase mb-1">Vehicles Today</span>
                  <span className="text-[#4EDEA3] font-space font-bold text-[24px] leading-none">48</span>
               </div>
               <div className="bg-[#06122D] rounded-lg p-4 px-6 flex-1 h-[71px] flex flex-col justify-center border border-[rgba(43,70,128,0.1)] shadow-sm">
                  <span className="text-[#91AAEB] font-inter font-semibold text-[10px] tracking-[1px] uppercase mb-1">Avg Stay Duration</span>
                  <span className="text-[#DEE5FF] font-space font-bold text-[24px] leading-none">42m 15s</span>
               </div>
               <div className="bg-[#06122D] rounded-lg p-4 px-6 flex-1 h-[71px] flex flex-col justify-center border border-[rgba(43,70,128,0.1)] shadow-sm">
                  <span className="text-[#91AAEB] font-inter font-semibold text-[10px] tracking-[1px] uppercase mb-1">Blacklist Count</span>
                  <span className="text-[#EE7D77] font-space font-bold text-[24px] leading-none">3</span>
               </div>
            </div>

            {/* Live Feeds */}
            <div className="grid grid-cols-2 gap-4 w-full h-[235px]">
               <LPDFeedCard title="LIVE: NORTH GATE" />
               <LPDFeedCard title="LIVE: LOADING DOCK" />
            </div>

            {/* Recent Logs Table */}
            <div className="bg-[#05183C] rounded-lg flex flex-col min-h-[265px] border border-[rgba(43,70,128,0.1)] shadow-sm">
               <div className="flex justify-between items-center px-6 py-5 border-b border-[rgba(43,70,128,0.1)]">
                  <div className="flex items-center gap-2">
                     <div className="bg-[#4EDEA3] w-[4px] h-[16px] rounded-sm"></div>
                     <span className="text-[#DEE5FF] font-space font-bold text-[16px]">Recent logs</span>
                  </div>
                  <div className="flex gap-3">
                     <button className="bg-[#031D4B] text-[#91AAEB] text-[10px] font-bold tracking-[1px] px-3 py-1.5 rounded-[2px] uppercase shadow-sm hover:text-[#DEE5FF] transition-colors">Export CSV</button>
                     <button className="bg-[#031D4B] text-[#91AAEB] text-[10px] font-bold tracking-[1px] px-4 py-1.5 rounded-[2px] uppercase shadow-sm hover:text-[#DEE5FF] transition-colors">Filter</button>
                  </div>
               </div>

               <div className="flex flex-col w-full flex-1">
                  {/* Table Header */}
                  <div className="flex items-center bg-[#06122D] px-6 py-4 uppercase text-[#91AAEB] text-[10px] font-bold tracking-[1px] border-b border-[rgba(43,70,128,0.1)]">
                     <div className="flex-[0.8]">Timestamp</div>
                     <div className="flex-[1.2]">License Plate</div>
                     <div className="flex-1">Status</div>
                     <div className="flex-1">Camera</div>
                     <div className="flex-[0.8] text-right">Confidence</div>
                  </div>
                  {/* Row 1 */}
                  <div className="flex items-center px-6 py-5 border-b border-[rgba(43,70,128,0.1)]">
                     <div className="flex-[0.8] text-[#91AAEB] font-mono text-[14px]">14:24:02</div>
                     <div className="flex-[1.2] text-[#4EDEA3] font-bold text-[14px] tracking-[0.7px]">ABC- 4582</div>
                     <div className="flex-1">
                        <span className="bg-[rgba(0,82,54,0.2)] text-[#4EDEA3] text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">Entry</span>
                     </div>
                     <div className="flex-1 text-[#91AAEB] text-[14px]">North Gate</div>
                     <div className="flex-[0.8] text-right text-[#91AAEB] text-[14px]">93 %</div>
                  </div>
                  {/* Row 2 */}
                  <div className="flex items-center bg-[#05183C] px-6 py-5 rounded-b-lg">
                     <div className="flex-[0.8] text-[#91AAEB] font-mono text-[14px]">14:23:45</div>
                     <div className="flex-[1.2] text-[#FFB148] font-bold text-[14px] tracking-[0.7px]">KLR-1109</div>
                     <div className="flex-1">
                        <span className="bg-[rgba(248,160,16,0.1)] text-[#FFB148] text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">Exit</span>
                     </div>
                     <div className="flex-1 text-[#91AAEB] text-[14px]">Loading Dock</div>
                     <div className="flex-[0.8] text-right text-[#91AAEB] text-[14px]">82 %</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column */}
         <div className="flex flex-col gap-6 w-[304px] flex-shrink-0">
            {/* Blacklist Detected Panel */}
            <div className="bg-[#7F2927]/10 border border-[#EE7D77]/30 rounded-lg p-6 flex flex-col gap-6 shadow-[0_0_15px_rgba(238,125,119,0.05)]">
               <div className="flex items-center gap-3">
                  <div className="bg-[#EE7D77] p-1.5 rounded-sm">
                     <ShieldAlert size={18} className="text-[#490106]" />
                  </div>
                  <span className="text-[#EE7D77] font-space font-bold text-[18px] tracking-[0.5px]">BLACKLIST DETECTED</span>
               </div>

               <div className="flex flex-col gap-4">
                  {/* Active Alert */}
                  <div className="bg-black/40 border border-[#EE7D77]/20 backdrop-blur-md rounded-[4px] p-4 flex flex-col gap-4 relative overflow-hidden">
                     <div className="flex justify-between items-center w-full relative z-10">
                        <span className="text-[#EE7D77] font-bold text-[10px] tracking-[1px] uppercase">Active Alert</span>
                        <span className="text-[#91AAEB] text-[10px] font-mono">14:12:05</span>
                     </div>
                     <div className="flex items-center gap-4 w-full relative z-10">
                        <div className="bg-[#00225A] border border-[#2B4680] text-[#DEE5FF] font-bold text-[14px] tracking-[1.4px] px-3 py-1.5 rounded-[2px] shadow-inner">
                           BR- 8812
                        </div>
                        <span className="text-[#91AAEB] text-[12px]">Theft Suspect</span>
                     </div>
                     <div className="flex gap-2 w-full mt-1 relative z-10">
                        <button className="flex-[1.5] bg-[#EE7D77] text-[#490106] font-bold text-[10px] tracking-[0.5px] py-2 rounded-[2px] uppercase hover:bg-[#EE7D77]/80 transition-colors shadow">Acknowledge</button>
                        <button className="flex-1 bg-[#8F9FB7] text-[#DEE5FF] font-bold text-[10px] tracking-[0.5px] py-2 rounded-[2px] uppercase hover:bg-[#8F9FB7]/80 transition-colors shadow">Ignore</button>
                     </div>
                  </div>

                  {/* Logged Item */}
                  <div className="bg-black/40 border border-[#2B4680]/20 backdrop-blur-sm rounded-[4px] p-4 flex flex-col gap-3 relative overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                     <div className="flex justify-between items-center w-full">
                        <span className="text-[#91AAEB] font-bold text-[10px] tracking-[1px] uppercase">Logged 12:45:00</span>
                     </div>
                     <div className="flex items-center gap-4 w-full">
                        <div className="bg-[#00225A] border border-[#2B4680] text-[#DEE5FF] font-bold text-[14px] tracking-[1.4px] px-3 py-1.5 rounded-[2px] whitespace-nowrap shadow-inner">
                           KL- 1992
                        </div>
                        <span className="text-[#91AAEB] text-[12px] truncate">Exp. Permit</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Recent Frame Grabs */}
            <div className="bg-[#05183C] rounded-lg p-6 flex flex-col gap-5 border border-[rgba(43,70,128,0.1)] shadow-sm">
               <div className="flex items-center gap-2">
                  <span className="text-[#8F9FB7]"><ImageIcon size={18} strokeWidth={2} /></span>
                  <span className="text-[#DEE5FF] font-space font-bold text-[16px]">Recent Frame Grabs</span>
               </div>

               <div className="flex gap-3 w-full">
                  <div className="flex flex-col gap-2 flex-1">
                     <div className="bg-black border border-[rgba(43,70,128,0.15)] rounded-sm aspect-[4/3] w-full shadow-inner"></div>
                     <span className="text-[#DEE5FF] font-inter font-bold text-[10px] text-center w-full">ABC- 4582</span>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                     <div className="bg-black border border-[rgba(43,70,128,0.15)] rounded-sm aspect-[4/3] w-full shadow-inner"></div>
                     <span className="text-[#DEE5FF] font-inter font-bold text-[10px] text-center w-full">KLR-1109</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

function LPDFeedCard({ title }) {
   return (
      <div className="bg-[#06122D] rounded-lg flex flex-col overflow-hidden h-[225px] border border-[rgba(43,70,128,0.1)] relative group shadow-sm">
         {/* Top HUD */}
         <div className="absolute top-4 left-4 bg-[rgba(0,34,90,0.7)] backdrop-blur-md px-2.5 py-1 rounded-[2px] flex items-center gap-2 z-10 border border-white/5">
            <div className="w-1.5 h-1.5 bg-[#4EDEA3] rounded-full animate-pulse"></div>
            <span className="text-[#4EDEA3] font-mono font-medium text-[10px] uppercase tracking-wide">{title}</span>
         </div>

         {/* Video Area (Black) */}
         <div className="bg-black w-full flex-1 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#05183C]/40 to-transparent"></div>
         </div>

         {/* Bottom Control Bar */}
         <div className="bg-[#05183C] h-[54px] flex justify-between items-center px-4 border-t border-[#06122D] z-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-[#4EDEA3] rounded-full"></div>
               <span className="text-[#DEE5FF] font-inter font-semibold text-[12px]">Active Monitoring</span>
            </div>

            <div className="flex items-center gap-2">
               <button className="text-[#91AAEB] hover:text-[#DEE5FF] hover:bg-white/5 p-1.5 rounded-[2px] transition-colors">
                  <Camera size={14} />
               </button>
               <button className="text-[#91AAEB] hover:text-[#DEE5FF] hover:bg-white/5 p-1.5 rounded-[2px] transition-colors">
                  <Maximize size={14} />
               </button>
            </div>
         </div>
      </div>
   )
}
