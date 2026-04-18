import React, { useState } from 'react';
import { 
   Plus, Filter, Download, Activity, Wrench, WifiOff, MoreHorizontal, 
   ChevronLeft, ChevronRight, Info, Database, Cpu, Settings2, Link, 
   VideoOff, ArrowLeftRight, Clock, Map, Check 
} from 'lucide-react';


export default function CameraConfig() {
   const [isAdding, setIsAdding] = useState(false);

   if (isAdding) {
      return <AddCameraForm onCancel={() => setIsAdding(false)} />;
   }

   return (
      <div className="flex flex-col w-full max-w-[1024px] animate-in fade-in transition-all pb-24">
         
         {/* Action Header */}
         <div className="flex justify-end w-full mb-8">
            <button 
               onClick={() => setIsAdding(true)}
               className="bg-[#4EDEA3] shadow-[0_4px_15px_rgba(78,222,163,0.15)] rounded-lg px-6 py-3 flex items-center gap-2 hover:bg-[#3dcd93] transition-colors relative group"
            >
               <div className="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-[#004A31]">
                  <Plus size={14} className="text-[#004A31]" strokeWidth={3} />
               </div>
               <span className="text-[#004A31] font-inter font-bold text-[16px]">Add New Camera</span>
            </button>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
            
            {/* Active Cameras */}
            <div className="bg-[#06122D] border border-[rgba(43,70,128,0.05)] rounded-lg p-5 flex flex-col gap-3 shadow-sm relative overflow-hidden">
               <div className="flex justify-between items-start w-full">
                  <span className="text-[#4EDEA3] font-inter font-bold text-[12px] uppercase tracking-[1.2px]">Active</span>
                  <div className="text-[rgba(78,222,163,0.6)]">
                     <Activity size={18} />
                  </div>
               </div>
               <div className="flex items-baseline gap-2 mt-1 mb-2">
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">42</span>
                  <span className="text-[#91AAEB] font-space font-light text-[18px]">/ 45</span>
               </div>
               <div className="w-full h-1 bg-[#00225A] rounded-full mt-auto">
                  <div className="h-full bg-[#4EDEA3] rounded-full" style={{ width: '93%' }}></div>
               </div>
            </div>

            {/* Maintenance */}
            <div className="bg-[#06122D] border border-[rgba(43,70,128,0.05)] rounded-lg p-5 flex flex-col gap-3 shadow-sm">
               <div className="flex justify-between items-start w-full">
                  <span className="text-[#FFB148] font-inter font-bold text-[12px] uppercase tracking-[1.2px]">Maintenance</span>
                  <div className="text-[rgba(255,177,72,0.6)]">
                     <Wrench size={16} />
                  </div>
               </div>
               <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">02</span>
               </div>
            </div>

            {/* System Offline */}
            <div className="bg-[#06122D] border border-[rgba(43,70,128,0.05)] rounded-lg p-5 flex flex-col gap-3 shadow-sm">
               <div className="flex justify-between items-start w-full">
                  <span className="text-[#EE7D77] font-inter font-bold text-[12px] uppercase tracking-[1.2px]">System Offline</span>
                  <div className="text-[rgba(238,125,119,0.6)]">
                     <WifiOff size={18} />
                  </div>
               </div>
               <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">01</span>
               </div>
            </div>

         </div>

         {/* Camera List Table */}
         <div className="bg-[#05183C] rounded-2xl flex flex-col flex-1 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-[rgba(43,70,128,0.1)] overflow-hidden">
            
            {/* Header */}
            <div className="bg-[#031D4B] px-6 py-4 flex justify-between items-center border-b border-[rgba(43,70,128,0.1)] w-full">
               <h3 className="text-[#DEE5FF] font-space font-medium text-[16px]">Camera list</h3>
               <div className="flex items-center gap-2">
                  <button className="text-[#91AAEB] hover:text-[#DEE5FF] hover:bg-white/5 p-2 rounded transition-colors">
                     <Filter size={18} />
                  </button>
                  <button className="text-[#91AAEB] hover:text-[#DEE5FF] hover:bg-white/5 p-2 rounded transition-colors">
                     <Download size={18} />
                  </button>
               </div>
            </div>

            {/* Table Container */}
            <div className="w-full flex-1 flex flex-col overflow-x-auto">
               {/* Column Headers */}
               <div className="grid grid-cols-[minmax(100px,1fr)_minmax(200px,2fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(160px,1.5fr)_minmax(100px,1fr)_minmax(60px,0.5fr)] bg-[rgba(6,18,45,0.5)] border-b border-[rgba(43,70,128,0.1)] items-center px-4 py-4 w-full min-w-[800px]">
                  <div className="px-4 text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-[1.2px]">Camera ID</div>
                  <div className="px-4 text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-[1.2px]">Name & Description</div>
                  <div className="px-4 text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-[1.2px]">Location</div>
                  <div className="px-4 text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-[1.2px]">Status</div>
                  <div className="px-4 text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-[1.2px]">Source / Floor</div>
                  <div className="px-4 text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-[1.2px]">Created At</div>
                  <div className="px-4 text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-[1.2px] text-right">Actions</div>
               </div>

               {/* Rows */}
               <div className="flex flex-col w-full min-w-[800px]">
                  
                  {/* Row 1 */}
                  <CameraRow 
                     id="CAM-0042" idType="success"
                     name="North-Entry Main" desc="High-definition wide angle for facial recognition"
                     location="Zone A"
                     status="Online" statusType="success"
                     sourceUrl="RTSP://10.0.4.42" floor="Floor 01"
                     date="Oct 12, 2023"
                  />
                  
                  {/* Row 2 */}
                  <CameraRow 
                     id="CAM-0012" idType="neutral"
                     name="Aisle 04 Thermal" desc="Heatmap tracking for high-traffic commerce"
                     location="Zone A"
                     status="Maintenance" statusType="warning"
                     sourceUrl="UDP://10.0.1.12" floor="Floor 01"
                     date="Sep 28, 2023"
                  />

                  {/* Row 3 */}
                  <CameraRow 
                     id="CAM-0089" idType="neutral"
                     name="Loading Dock 02" desc="LPR enabled for vehicle tracking"
                     location="Parking"
                     status="Offline" statusType="error"
                     sourceUrl="RTSP://10.0.8.89" floor="Floor 00"
                     date="Aug 15, 2023"
                  />

                  {/* Row 4 */}
                  <CameraRow 
                     id="CAM-0056" idType="success"
                     name="Vault Corridor 01" desc="High-security perimeter monitoring"
                     location="Zone B"
                     status="Online" statusType="success"
                     sourceUrl="HTTP://10.0.5.56" floor="Floor 02"
                     date="Nov 03, 2023"
                  />

                  {/* Row 5 */}
                  <CameraRow 
                     id="CAM-0031" idType="success"
                     name="Elevator Bank South" desc="PTZ camera with automated sweep pattern"
                     location="Zone A"
                     status="Online" statusType="success"
                     sourceUrl="RTSP://10.0.3.31" floor="Floor 03"
                     date="Oct 30, 2023"
                     isLast={true}
                  />

               </div>
            </div>

            {/* Pagination Footer */}
            <div className="bg-[#031D4B] px-6 py-[14px] border-t border-[rgba(43,70,128,0.1)] flex justify-between items-center mt-auto">
               <span className="text-[#91AAEB] font-inter text-[12px]">Showing <strong className="text-[#DEE5FF] font-medium">1 - 5</strong> of 45 cameras</span>
               <div className="flex gap-1.5">
                  <button className="w-8 h-8 flex items-center justify-center bg-black rounded-sm border border-transparent hover:border-[#2B4680] text-[#8F9FB7] hover:text-[#DEE5FF] transition-all">
                     <ChevronLeft size={16} />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center bg-[#4EDEA3] rounded-sm text-[#004A31] font-inter text-[12px] font-medium shadow-sm">
                     1
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center bg-black rounded-sm border border-transparent hover:border-[#2B4680] text-[#91AAEB] hover:text-[#DEE5FF] transition-all font-inter text-[12px]">
                     2
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center bg-black rounded-sm border border-transparent hover:border-[#2B4680] text-[#91AAEB] hover:text-[#DEE5FF] transition-all font-inter text-[12px]">
                     3
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center bg-black rounded-sm border border-transparent hover:border-[#2B4680] text-[#8F9FB7] hover:text-[#DEE5FF] transition-all">
                     <ChevronRight size={16} />
                  </button>
               </div>
            </div>

         </div>

      </div>
   );
}


function AddCameraForm({ onCancel }) {
   return (
      <div className="flex flex-col w-full max-w-[1024px] animate-in fade-in slide-in-from-bottom-4 transition-all pb-32 gap-10 mt-2">
         
         {/* Page Header */}
         <div className="flex w-full">
            <h2 className="text-[#DEE5FF] font-space font-bold text-[36px] tracking-[-0.9px]">Initialize New Camera</h2>
         </div>

         {/* Layout Grid */}
         <div className="flex flex-col lg:flex-row gap-6 w-full">
            
            {/* LEFT COLUMN */}
            <div className="flex flex-col flex-1 gap-6 min-w-0">
               
               {/* Basic Information */}
               <div className="bg-[rgba(0,34,90,0.4)] backdrop-blur-md border border-[rgba(43,70,128,0.3)] rounded-lg p-6 md:p-8 flex flex-col gap-8 shadow-sm">
                  <div className="flex items-center gap-3">
                     <div className="text-[#4EDEA3]"><Info size={20} strokeWidth={2.5} /></div>
                     <h3 className="text-[#DEE5FF] font-space font-semibold text-[18px]">Basic Information</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 w-full">
                     <div className="flex flex-col gap-2.5 flex-1 w-full">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Camera Name</label>
                        <input type="text" placeholder="e.g. SOUTH_ENTRANCE_01" className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter placeholder:text-[#6B7280] focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner" />
                     </div>
                     <div className="flex flex-col gap-2.5 flex-1 w-full">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Location / Zone</label>
                        <select className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter focus:border-[#4EDEA3] focus:outline-none transition-colors appearance-none shadow-inner" defaultValue="Zone A - Loading Dock">
                           <option value="Zone A - Loading Dock">Zone A - Loading Dock</option>
                           <option value="Zone B - Vault">Zone B - Vault</option>
                           <option value="Zone C - Lobby">Zone C - Lobby</option>
                        </select>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2.5 w-full">
                     <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Source RTSP/HTTP URL</label>
                     <div className="relative flex items-center w-full group">
                        <div className="absolute left-4 text-[#91AAEB] group-focus-within:text-[#4EDEA3] transition-colors"><Link size={14} /></div>
                        <input type="text" defaultValue="rtsp://admin:password@192.168.1.100:554/stream1" className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] pl-10 pr-4 text-[14px] text-[#6B7280] font-mono focus:text-[#DEE5FF] focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner" />
                     </div>
                  </div>
               </div>

               {/* Metadata & Context */}
               <div className="bg-[#06122D] rounded-lg p-6 md:p-8 flex flex-col gap-8">
                  <div className="flex items-center gap-3">
                     <div className="text-[#FFB148]"><Database size={18} strokeWidth={2.5} /></div>
                     <h3 className="text-[#DEE5FF] font-space font-semibold text-[18px]">Metadata & Context</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 w-full">
                     <div className="flex flex-col gap-2.5 w-full md:w-[124px] shrink-0">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Floor Level</label>
                        <input type="text" placeholder="0" className="bg-[#05183C] border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter placeholder:text-[#6B7280] focus:border-[#4EDEA3] focus:outline-none transition-colors" />
                     </div>
                     <div className="flex flex-col gap-2.5 flex-1 w-full">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Description</label>
                        <input type="text" placeholder="Detailed purpose of this optical sensor..." className="bg-[#05183C] border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter placeholder:text-[#6B7280] focus:border-[#4EDEA3] focus:outline-none transition-colors" />
                     </div>
                  </div>
               </div>

               {/* Form Actions (Desktop) */}
               <div className="hidden lg:flex justify-end items-center gap-4 pt-4 mt-auto">
                  <button onClick={onCancel} className="text-[#91AAEB] font-inter font-bold text-[14px] px-8 py-3 hover:text-[#DEE5FF] hover:bg-white/5 rounded transition-all">
                     Cancel
                  </button>
                  <button onClick={onCancel} className="bg-[#4EDEA3] text-[#004A31] font-inter font-bold text-[16px] px-10 py-3 rounded hover:bg-[#3dcd93] transition-colors shadow-[0_4px_15px_rgba(78,222,163,0.15)] truncate">
                     Save Camera Node
                  </button>
               </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-6 w-full lg:w-[304px] shrink-0">
               
               {/* Intelligence Modules */}
               <div className="bg-[#05183C] border border-[rgba(43,70,128,0.05)] rounded-lg p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                     <div className="text-[#4EDEA3]"><Cpu size={18} strokeWidth={2.5} /></div>
                     <h3 className="text-[#DEE5FF] font-space font-semibold text-[16px]">Intelligence Modules</h3>
                  </div>

                  <div className="flex flex-col gap-3 w-full">
                     {/* Item 1 */}
                     <label className="flex items-center gap-4 bg-[#06122D] rounded px-4 py-3 cursor-pointer group hover:bg-[rgba(6,18,45,0.7)] transition-colors">
                        <div className="w-[18px] h-[18px] flex items-center justify-center bg-black border border-[rgba(43,70,128,0.4)] rounded-sm group-hover:border-[#4EDEA3] transition-colors flex-shrink-0">
                           <Check size={12} className="text-[#4EDEA3] opacity-0" />
                        </div>
                        <span className="text-[#DEE5FF] font-inter font-semibold text-[14px]">Consumer Analytics</span>
                     </label>

                     {/* Item 2 */}
                     <label className="flex items-center gap-4 bg-[#06122D] rounded px-4 py-3 cursor-pointer group hover:bg-[rgba(6,18,45,0.7)] transition-colors border border-[rgba(78,222,163,0.2)]">
                        <div className="w-[18px] h-[18px] flex items-center justify-center bg-black border border-[#4EDEA3] rounded-sm transition-colors flex-shrink-0">
                           <Check size={12} className="text-[#4EDEA3] opacity-100" />
                        </div>
                        <span className="text-[#DEE5FF] font-inter font-semibold text-[14px]">License Plate detection</span>
                     </label>

                     {/* Item 3 */}
                     <label className="flex items-center gap-4 bg-[#06122D] rounded px-4 py-3 cursor-pointer group hover:bg-[rgba(6,18,45,0.7)] transition-colors border border-[rgba(78,222,163,0.2)]">
                        <div className="w-[18px] h-[18px] flex items-center justify-center bg-black border border-[#4EDEA3] rounded-sm transition-colors flex-shrink-0">
                           <Check size={12} className="text-[#4EDEA3] opacity-100" />
                        </div>
                        <span className="text-[#DEE5FF] font-inter font-semibold text-[14px]">Security analytics</span>
                     </label>
                  </div>
               </div>

               {/* Features */}
               <div className="bg-[#05183C] border border-[rgba(43,70,128,0.05)] rounded-lg p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                     <div className="text-[#FFB148]"><Settings2 size={18} strokeWidth={2.5} /></div>
                     <h3 className="text-[#DEE5FF] font-space font-semibold text-[16px]">Features</h3>
                  </div>

                  <div className="flex flex-col gap-5 w-full">
                     {/* Toggle 1 */}
                     <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                           <ArrowLeftRight size={14} className="text-[#91AAEB]" />
                           <span className="text-[#DEE5FF] font-inter text-[14px]">IN / OUT count</span>
                        </div>
                        <button className="w-10 h-[22px] bg-[#00225A] rounded-full flex justify-start items-center p-1 transition-colors">
                           <div className="w-[14px] h-[14px] bg-[#8F9FB7] rounded-full"></div>
                        </button>
                     </div>

                     {/* Toggle 2 */}
                     <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                           <Clock size={14} className="text-[#91AAEB]" />
                           <span className="text-[#DEE5FF] font-inter text-[14px]">Dwell time</span>
                        </div>
                        <button className="w-10 h-[22px] bg-[#005236]/50 rounded-full flex justify-end items-center p-1 transition-colors shadow-inner">
                           <div className="w-[14px] h-[14px] bg-[#4EDEA3] rounded-full"></div>
                        </button>
                     </div>

                     {/* Toggle 3 */}
                     <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                           <Map size={14} className="text-[#91AAEB]" />
                           <span className="text-[#DEE5FF] font-inter text-[14px]">Heat mapping</span>
                        </div>
                        <button className="w-10 h-[22px] bg-[#00225A] rounded-full flex justify-start items-center p-1 transition-colors">
                           <div className="w-[14px] h-[14px] bg-[#8F9FB7] rounded-full"></div>
                        </button>
                     </div>
                  </div>
               </div>

               {/* Preview Card */}
               <div className="bg-black border border-[rgba(43,70,128,0.2)] rounded-lg min-h-[171px] flex flex-col justify-center items-center gap-3 overflow-hidden relative shadow-inner">
                  {/* Subtle tv static / gradient background */}
                  <div 
                     className="absolute inset-0 opacity-[0.05]"
                     style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)`
                     }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
                  
                  <div className="flex flex-col justify-center items-center gap-2 z-10 w-full p-6 text-center">
                     <VideoOff size={32} className="text-[#4EDEA3] mb-2" strokeWidth={1.5} />
                     <span className="text-[#DEE5FF] font-inter font-bold text-[12px] tracking-[1.2px] uppercase">No Signal</span>
                     <span className="text-[#91AAEB] font-inter text-[10px] leading-relaxed max-w-[80%] mx-auto">Preview will activate after validation</span>
                  </div>
               </div>

            </div>

            {/* Form Actions (Mobile) */}
            <div className="flex lg:hidden flex-col items-center gap-3 mt-4">
               <button onClick={onCancel} className="bg-[#4EDEA3] text-[#004A31] w-full font-inter font-bold text-[16px] px-10 py-4 rounded hover:bg-[#3dcd93] transition-colors shadow-[0_4px_15px_rgba(78,222,163,0.15)] text-center">
                  Save Camera Node
               </button>
               <button onClick={onCancel} className="text-[#91AAEB] w-full font-inter font-bold text-[14px] px-8 py-4 hover:text-[#DEE5FF] hover:bg-white/5 rounded transition-all text-center">
                  Cancel
               </button>
            </div>

         </div>
      </div>
   );
}


function CameraRow({ id, idType, name, desc, location, status, statusType, sourceUrl, floor, date, isLast }) {
   return (
      <div className={`grid grid-cols-[minmax(100px,1fr)_minmax(200px,2fr)_minmax(100px,1fr)_minmax(120px,1fr)_minmax(160px,1.5fr)_minmax(100px,1fr)_minmax(60px,0.5fr)] items-center px-4 py-5 ${isLast ? '' : 'border-b border-[rgba(43,70,128,0.05)]'} hover:bg-[#06122D]/50 transition-colors group`}>
         
         {/* ID */}
         <div className="px-4">
            <span className={`px-2 py-1.5 rounded-[2px] font-mono text-[11px] font-medium tracking-wide inline-block ${
               idType === 'success' ? 'bg-[#00225A] text-[#4EDEA3] border border-[rgba(78,222,163,0.1)] shadow-inner' : 'bg-[#001844] border border-[rgba(43,70,128,0.3)] text-[#91AAEB]'
            }`}>
               {id}
            </span>
         </div>

         {/* Name & Desc */}
         <div className="flex flex-col gap-1 px-4 pr-8">
            <span className="text-[#DEE5FF] font-inter font-medium text-[14px] group-hover:text-[#4EDEA3] transition-colors">{name}</span>
            <span className="text-[#91AAEB] font-inter text-[12px] leading-snug line-clamp-2">{desc}</span>
         </div>

         {/* Location */}
         <div className="px-4">
            <span className="text-[#DEE5FF] font-inter text-[14px]">{location}</span>
         </div>

         {/* Status */}
         <div className="flex items-center gap-2 px-4 whitespace-nowrap">
            {statusType === 'success' && <div className="w-2 h-2 rounded-full bg-[#4EDEA3]"></div>}
            {statusType === 'warning' && <Wrench size={12} className="text-[#FFB148]" strokeWidth={2.5}/>}
            {statusType === 'error' && <div className="w-2 h-2 rounded-full bg-[#EE7D77]"></div>}
            <span className={`font-inter font-semibold text-[12px] tracking-[0.5px] ${
               statusType === 'success' ? 'text-[#4EDEA3]' :
               statusType === 'warning' ? 'text-[#FFB148]' : 'text-[#EE7D77]'
            }`}>
               {status}
            </span>
         </div>

         {/* Source / Floor */}
         <div className="flex flex-col gap-0.5 px-4 pr-8">
            <span className="text-[#DEE5FF] font-inter font-medium text-[12px] tracking-wide break-all line-clamp-1">{sourceUrl}</span>
            <span className="text-[#91AAEB] font-inter text-[10px] uppercase tracking-[0.5px]">{floor}</span>
         </div>

         {/* Created At */}
         <div className="px-4 flex flex-col">
            <span className="text-[#91AAEB] font-inter text-[13px] leading-snug whitespace-nowrap">
               {date.split(',')[0]}<br/>{date.split(',')[1]}
            </span>
         </div>

         {/* Actions */}
         <div className="px-4 flex justify-end">
            <button className="text-[rgba(145,170,235,0)] group-hover:text-[#91AAEB] hover:!text-[#DEE5FF] p-2 rounded transition-all opacity-0 group-hover:opacity-100">
               <MoreHorizontal size={18} />
            </button>
         </div>

      </div>
   );
}
