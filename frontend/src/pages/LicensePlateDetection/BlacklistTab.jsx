import React from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';

export default function BlacklistTab() {
   return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in transition-all">
         
         {/* Page Header & Action Bar */}
         <div className="flex justify-between items-end w-full mb-2">
            <h2 className="text-[#DEE5FF] font-space font-bold text-[36px] leading-[40px] tracking-[-0.9px]">
               Blacklist Management
            </h2>
            <button className="bg-[#4EDEA3] shadow-[0_0_20px_rgba(78,222,163,0.2)] rounded-lg px-6 py-3 flex items-center gap-2 hover:bg-[#3dcd93] transition-colors">
               <div className="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-[#004A31]">
                  <Plus size={14} className="text-[#004A31]" strokeWidth={3} />
               </div>
               <span className="text-[#004A31] font-inter font-bold text-[16px]">Add New Vehicle</span>
            </button>
         </div>

         {/* Bento Grid Layout */}
         <div className="flex flex-col xl:flex-row gap-6 w-full">
            
            {/* Left Column (Recent Detections) */}
            <div className="bg-[#06122D] rounded-lg p-6 w-[304px] flex-shrink-0 flex flex-col gap-4 relative overflow-hidden box-border">
               {/* Background Glow */}
               <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[rgba(78,222,163,0.05)] rounded-full blur-[32px] pointer-events-none z-0"></div>

               <h3 className="text-[#8F9FB7] font-inter font-semibold text-[12px] tracking-[1.2px] uppercase relative z-10 w-full mb-1">
                  Recent Detections
               </h3>

               {/* Detection Item 1 */}
               <div className="bg-[#05183C] rounded flex items-center p-3 gap-4 relative z-10 border border-[rgba(43,70,128,0.2)]">
                  <div className="bg-black w-[64px] h-[48px] rounded-[2px] opacity-80 flex-shrink-0"></div>
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between w-full items-start">
                        <span className="text-[#4EDEA3] font-mono font-bold text-[14px] leading-none">KRG-9204</span>
                        <span className="text-[#EE7D77] font-inter font-bold text-[10px] uppercase">Triggered</span>
                     </div>
                     <div className="flex justify-between w-full items-start mt-1">
                        <span className="text-[#91AAEB] font-inter text-[10px]">Gate 04 (North)</span>
                        <span className="text-[#91AAEB] font-inter text-[10px]">2 mins ago</span>
                     </div>
                  </div>
               </div>

               {/* Detection Item 2 */}
               <div className="bg-[#05183C] rounded flex items-center p-3 gap-4 relative z-10 border border-[rgba(43,70,128,0.2)]">
                  <div className="bg-black w-[64px] h-[48px] rounded-[2px] opacity-80 flex-shrink-0"></div>
                  <div className="flex flex-col gap-1 w-full">
                     <div className="flex justify-between w-full items-start">
                        <span className="text-[#4EDEA3] font-mono font-bold text-[14px] leading-none">TX-5512L</span>
                        <span className="text-[#91AAEB] font-inter font-bold text-[10px] uppercase">Logged</span>
                     </div>
                     <div className="flex justify-between w-full items-start mt-1">
                        <span className="text-[#91AAEB] font-inter text-[10px]">Loading Mock B</span>
                        <span className="text-[#91AAEB] font-inter text-[10px]">14 mins ago</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column (Table Area) */}
            <div className="bg-[#06122D] rounded-lg flex-1 flex flex-col relative overflow-hidden">
               
               {/* Filter Header */}
               <div className="bg-[rgba(5,24,60,0.3)] border-b border-[rgba(43,70,128,0.1)] px-6 py-5 flex justify-between items-center w-full">
                  
                  {/* Search Input */}
                  <div className="relative w-[376px]">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Search size={18} className="text-[#4EDEA3]" />
                     </div>
                     <input 
                        type="text" 
                        placeholder="Filter by Plate" 
                        className="bg-black w-full rounded-lg py-3 pl-12 pr-4 text-[14px] font-inter text-[#DEE5FF] placeholder:text-[rgba(145,170,235,0.4)] focus:outline-none focus:ring-1 focus:ring-[rgba(78,222,163,0.3)]"
                     />
                  </div>

                  <div className="flex gap-2">
                     <button className="flex items-center gap-2 bg-[rgba(0,34,90,0.5)] border border-[rgba(43,70,128,0.2)] px-4 py-2 rounded text-[#DEE5FF] hover:bg-[rgba(0,34,90,0.8)] transition-colors">
                        <Filter size={14} />
                        <span className="font-inter font-semibold text-[12px]">Status</span>
                     </button>
                     <button className="flex items-center gap-2 bg-[rgba(0,34,90,0.5)] border border-[rgba(43,70,128,0.2)] px-4 py-2 rounded text-[#DEE5FF] hover:bg-[rgba(0,34,90,0.8)] transition-colors">
                        <Download size={14} />
                        <span className="font-inter font-semibold text-[12px]">Export</span>
                     </button>
                  </div>
               </div>

               {/* Table Content */}
               <div className="flex flex-col w-full min-h-[421px]">
                  
                  {/* Table Header */}
                  <div className="flex items-center bg-[rgba(5,24,60,0.5)] border-b border-[rgba(43,70,128,0.1)] px-6 py-4 uppercase text-[#8F9FB7] text-[10px] font-bold tracking-[1px]">
                     <div className="flex-[0.8] pl-2">License Plate</div>
                     <div className="flex-1">Reason</div>
                     <div className="flex-[0.8]">Date Added</div>
                     <div className="flex-[0.8]">Added By</div>
                  </div>

                  {/* Rows Container */}
                  <div className="flex flex-col pb-[72px]">
                     
                     {/* Row 1 */}
                     <div className="flex items-center border-b border-[#05183C] px-6 py-5 hover:bg-[#05183C]/50 transition-colors">
                        <div className="flex-[0.8]">
                           <div className="bg-[#00225A] border border-[rgba(78,222,163,0.2)] text-[#4EDEA3] font-mono font-bold text-[14px] px-3 py-2 rounded-[2px] w-max tracking-wider shadow-inner">
                              KRG-9204
                           </div>
                        </div>
                        <div className="flex-1">
                           <span className="bg-[rgba(238,125,119,0.1)] text-[#EE7D77] font-bold text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-[2px] w-max inline-block">
                              Theft Investigation
                           </span>
                        </div>
                        <div className="flex-[0.8] text-[#91AAEB] font-inter font-medium text-[14px]">
                           Oct 12, 2023
                        </div>
                        <div className="flex-[0.8] text-[#91AAEB] font-inter font-medium text-[14px]">
                           John Doe
                        </div>
                     </div>

                     {/* Row 2 */}
                     <div className="flex items-center bg-[#05183C]/30 border-b border-[#05183C] px-6 py-5 hover:bg-[#05183C]/50 transition-colors">
                        <div className="flex-[0.8]">
                           <div className="bg-[#00225A] border border-[rgba(78,222,163,0.2)] text-[#4EDEA3] font-mono font-bold text-[14px] px-3 py-2 rounded-[2px] w-max tracking-wider shadow-inner">
                              TX-5512L
                           </div>
                        </div>
                        <div className="flex-1">
                           <span className="bg-[rgba(255,177,72,0.1)] text-[#FFB148] font-bold text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-[2px] w-max inline-block">
                              Unauthorized Access
                           </span>
                        </div>
                        <div className="flex-[0.8] text-[#91AAEB] font-inter font-medium text-[14px]">
                           Nov 01, 2023
                        </div>
                        <div className="flex-[0.8] text-[#91AAEB] font-inter font-medium text-[14px]">
                           Jane Doe
                        </div>
                     </div>

                     {/* Row 3 */}
                     <div className="flex items-center border-b border-[#05183C] px-6 py-5 hover:bg-[#05183C]/50 transition-colors">
                        <div className="flex-[0.8]">
                           <div className="bg-[#00225A] border border-[rgba(78,222,163,0.2)] text-[#4EDEA3] font-mono font-bold text-[14px] px-3 py-2 rounded-[2px] w-max tracking-wider shadow-inner">
                              B-7721-OP
                           </div>
                        </div>
                        <div className="flex-1">
                           <span className="bg-[rgba(78,222,163,0.1)] text-[#4EDEA3] font-bold text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-[2px] w-max inline-block">
                              Corporate Ban
                           </span>
                        </div>
                        <div className="flex-[0.8] text-[#91AAEB] font-inter font-medium text-[14px]">
                           Dec 05, 2023
                        </div>
                        <div className="flex-[0.8] text-[#91AAEB] font-inter font-medium text-[14px]">
                           John Doe
                        </div>
                     </div>

                     {/* Row 4 */}
                     <div className="flex items-center bg-[#05183C]/30 border-b border-[#05183C] px-6 py-5 hover:bg-[#05183C]/50 transition-colors">
                        <div className="flex-[0.8]">
                           <div className="bg-[#00225A] border border-[rgba(78,222,163,0.2)] text-[#4EDEA3] font-mono font-bold text-[14px] px-3 py-2 rounded-[2px] w-max tracking-wider shadow-inner">
                              NY-ALERT-1
                           </div>
                        </div>
                        <div className="flex-1">
                           <span className="bg-[rgba(238,125,119,0.1)] text-[#EE7D77] font-bold text-[10px] tracking-[0.5px] uppercase px-2.5 py-1 rounded-[2px] w-max inline-block shadow-sm">
                              Active Felony Want
                           </span>
                        </div>
                        <div className="flex-[0.8] text-[#91AAEB] font-inter font-medium text-[14px]">
                           Jan 22, 2024
                        </div>
                        <div className="flex-[0.8] text-[#91AAEB] font-inter font-medium text-[14px]">
                           Jane Doe
                        </div>
                     </div>
                  </div>

                  {/* Pagination Footer */}
                  <div className="absolute bottom-0 w-full bg-[rgba(5,24,60,0.4)] border-t border-[rgba(43,70,128,0.1)] px-6 py-[18px] flex justify-between items-center backdrop-blur-sm">
                     <span className="text-[#91AAEB] font-inter text-[14px]">
                        Showing 4 of 65 blacklisted vehicles
                     </span>
                     <div className="flex items-center gap-2">
                        <button className="bg-[#05183C] px-4 py-1.5 rounded-md text-[#91AAEB] font-inter text-[14px] hover:text-[#DEE5FF] hover:bg-[#05183C]/80 transition-colors">
                           Previous
                        </button>
                        <button className="bg-[#4EDEA3] px-3.5 py-1.5 rounded-md text-[#004A31] font-inter text-[14px] font-medium shadow-sm">
                           1
                        </button>
                        <button className="bg-[#05183C] px-3.5 py-1.5 rounded-md text-[#91AAEB] font-inter text-[14px] hover:text-[#DEE5FF] hover:bg-[#05183C]/80 transition-colors">
                           2
                        </button>
                        <button className="bg-[#05183C] px-4 py-1.5 rounded-md text-[#91AAEB] font-inter text-[14px] hover:text-[#DEE5FF] hover:bg-[#05183C]/80 transition-colors">
                           Next
                        </button>
                     </div>
                  </div>

               </div>
            </div>
         </div>

      </div>
   );
}
