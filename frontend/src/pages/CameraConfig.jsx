import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCameras, addCamera, updateCamera, deleteCamera } from '../services/api';
import { 
   Plus, Filter, Download, Activity, Wrench, WifiOff, MoreHorizontal, 
   ChevronLeft, ChevronRight, Info, Database, Cpu, Settings2, Link, 
   VideoOff, ArrowLeftRight, Clock, Map, Check, Flame, Crosshair, Edit2, Trash2 
} from 'lucide-react';
import LineSetupModal from '../components/LineSetupModal';


export default function CameraConfig() {
   const queryClient = useQueryClient();
   const [isAdding, setIsAdding] = useState(false);
   const [editingCamera, setEditingCamera] = useState(null);

   const { data: cameras, isLoading, isError } = useQuery({
      queryKey: ['cameras'],
      queryFn: getCameras,
   });

   const deleteMutation = useMutation({
      mutationFn: deleteCamera,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['cameras'] });
      }
   });

   if (isAdding || editingCamera) {
      return <AddCameraForm initialData={editingCamera} onCancel={() => { setIsAdding(false); setEditingCamera(null); }} />;
   }

   const activeCameras = cameras?.filter(c => c.status?.toLowerCase() === 'online') || [];
   const maintenanceCameras = cameras?.filter(c => c.status?.toLowerCase() === 'maintenance') || [];
   const offlineCameras = cameras?.filter(c => c.status?.toLowerCase() === 'offline') || [];

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
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">{activeCameras.length.toString().padStart(2, '0')}</span>
                  <span className="text-[#91AAEB] font-space font-light text-[18px]">/ {cameras?.length || 0}</span>
               </div>
               <div className="w-full h-1 bg-[#00225A] rounded-full mt-auto">
                  <div className="h-full bg-[#4EDEA3] rounded-full" style={{ width: `${cameras?.length ? (activeCameras.length / cameras.length) * 100 : 0}%` }}></div>
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
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">{maintenanceCameras.length.toString().padStart(2, '0')}</span>
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
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">{offlineCameras.length.toString().padStart(2, '0')}</span>
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
            <div className="w-full flex-1 flex flex-col overflow-x-auto min-h-[300px]">
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
                  {isLoading && (
                     <div className="w-full flex justify-center py-10">
                        <span className="text-[#91AAEB] font-inter">Loading cameras...</span>
                     </div>
                  )}
                  {isError && (
                     <div className="w-full flex justify-center py-10">
                        <span className="text-[#EE7D77] font-inter">Failed to load cameras. Backend might be unreachable.</span>
                     </div>
                  )}
                  {!isLoading && !isError && cameras?.length === 0 && (
                     <div className="w-full flex justify-center py-10">
                         <span className="text-[#91AAEB] font-inter">No cameras configured yet.</span>
                     </div>
                  )}
                  {!isLoading && cameras?.map((camera, index) => {
                     let statusType = 'neutral';
                     if (camera.status?.toLowerCase() === 'online') statusType = 'success';
                     if (camera.status?.toLowerCase() === 'offline') statusType = 'error';
                     if (camera.status?.toLowerCase() === 'maintenance') statusType = 'warning';

                     return (
                        <CameraRow 
                           key={camera.camera_id}
                           id={camera.camera_id} 
                           idType={statusType === 'success' ? 'success' : 'neutral'}
                           name={camera.name} 
                           desc={camera.desc || "Standard fixed optical sensor"} 
                           location={camera.location || "Unknown"}
                           status={camera.status || "Unknown"} 
                           statusType={statusType}
                           sourceUrl={camera.sourceUrl || "RTSP://LOCAL_STREAM"} 
                           floor={camera.floor || "Floor 1"} 
                           date={camera.date || new Date().toLocaleDateString('en-US') + ", " + new Date().toLocaleTimeString()} 
                           onEdit={() => setEditingCamera(camera)}
                           onDelete={(id) => deleteMutation.mutate(id)}
                           isLast={index === cameras.length - 1}
                        />
                     )
                  })}
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


const moduleFeatures = {
   'Consumer Analytics': [
      { id: 'IN / OUT count', label: 'IN / OUT count', icon: ArrowLeftRight },
      { id: 'Dwell time', label: 'Dwell time', icon: Clock },
      { id: 'Heat mapping', label: 'Heat mapping', icon: Map }
   ],
   'License Plate detection': [],
   'Security analytics': [
      { id: 'Fire detection', label: 'Fire detection', icon: Flame },
      { id: 'Weapon detection', label: 'Weapon detection', icon: Crosshair }
   ]
};

function AddCameraForm({ initialData, onCancel }) {
   const queryClient = useQueryClient();
   
   // Form States
   const [name, setName] = useState(initialData?.name || '');
   const [location, setLocation] = useState(initialData?.location || '');
   const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || 'rtsp://admin:password@192.168.1.100:554/stream1');
   const [floor, setFloor] = useState(initialData?.floor || '');
   const [description, setDescription] = useState(initialData?.desc || '');
   const [status, setStatus] = useState(initialData?.status || 'Offline');

   const [selectedModule, setSelectedModule] = useState(initialData?.module || 'Consumer Analytics');
   
   const defaultFeatures = {
      'IN / OUT count': false,
      'Dwell time': true,
      'Heat mapping': false,
      'Fire detection': false,
      'Weapon detection': false
   };
   const [featuresState, setFeaturesState] = useState(initialData?.features || defaultFeatures);
   const [inOutConfig, setInOutConfig] = useState(initialData?.inOutConfig || null);
   const [showLineModal, setShowLineModal] = useState(false);
   
   const isEditing = !!initialData;

   const toggleFeature = (featureId) => {
      setFeaturesState(prev => ({ ...prev, [featureId]: !prev[featureId] }));
   };

   const currentFeatures = moduleFeatures[selectedModule] || [];

   const mutation = useMutation({
      mutationFn: isEditing ? updateCamera : addCamera,
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['cameras'] });
         onCancel();
      }
   });

   const handleSave = () => {
      const payload = {
         name,
         location,
         sourceUrl,
         floor,
         description,
         module: selectedModule,
         features: featuresState,
         status,
         inOutConfig
      };
      if (isEditing) {
         mutation.mutate({ id: initialData.camera_id, cameraData: payload });
      } else {
         mutation.mutate(payload);
      }
   };

   return (
      <div className="flex flex-col w-full max-w-[1024px] animate-in fade-in slide-in-from-bottom-4 transition-all pb-32 gap-10 mt-2">
         
         {/* Page Header */}
         <div className="flex w-full">
            <h2 className="text-[#DEE5FF] font-space font-bold text-[36px] tracking-[-0.9px]">{isEditing ? 'Edit Camera Configuration' : 'Initialize New Camera'}</h2>
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
                        <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. SOUTH_ENTRANCE_01" className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter placeholder:text-[#6B7280] focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner" />
                     </div>
                     <div className="flex flex-col gap-2.5 flex-1 w-full">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Location / Zone</label>
                        <input value={location} onChange={e => setLocation(e.target.value)} type="text" placeholder="e.g. Zone A - Loading Dock" className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter placeholder:text-[#6B7280] focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner" />
                     </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 w-full">
                     <div className="flex flex-col gap-2.5 flex-1 w-full">
                        <div className="flex justify-between items-center w-full">
                           <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Source RTSP/HTTP URL</label>
                           <button 
                              type="button"
                              onClick={() => setSourceUrl('demo://videos/p.mp4')}
                              className="text-[#4EDEA3] font-inter font-bold text-[10px] uppercase tracking-[1px] hover:underline"
                           >
                              Use Demo Video
                           </button>
                        </div>
                        <div className="relative flex items-center w-full group">
                           <div className="absolute left-4 text-[#91AAEB] group-focus-within:text-[#4EDEA3] transition-colors"><Link size={14} /></div>
                           <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} type="text" className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] pl-10 pr-4 text-[14px] text-[#6B7280] font-mono focus:text-[#DEE5FF] focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner" />
                        </div>
                     </div>
                     <div className="flex flex-col gap-2.5 w-full md:w-[200px] shrink-0">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Camera Status</label>
                        <div className="relative flex items-center w-full group">
                           <select value={status} onChange={e => setStatus(e.target.value)} className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 pr-10 text-[14px] text-[#DEE5FF] font-inter focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner appearance-none cursor-pointer">
                              <option value="Online">Online</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Offline">Offline</option>
                           </select>
                           <div className="absolute right-4 text-[#91AAEB] pointer-events-none group-focus-within:text-[#4EDEA3] transition-colors">
                              <ChevronRight size={14} className="rotate-90" />
                           </div>
                        </div>
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
                        <input value={floor} onChange={e => setFloor(e.target.value)} type="text" placeholder="0" className="bg-[#05183C] border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter placeholder:text-[#6B7280] focus:border-[#4EDEA3] focus:outline-none transition-colors" />
                     </div>
                     <div className="flex flex-col gap-2.5 flex-1 w-full">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">Description</label>
                        <input value={description} onChange={e => setDescription(e.target.value)} type="text" placeholder="Detailed purpose of this optical sensor..." className="bg-[#05183C] border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter placeholder:text-[#6B7280] focus:border-[#4EDEA3] focus:outline-none transition-colors" />
                     </div>
                  </div>
               </div>

               {/* Form Actions (Desktop) */}
               <div className="hidden lg:flex justify-end items-center gap-4 pt-4 mt-auto">
                  <button onClick={onCancel} className="text-[#91AAEB] font-inter font-bold text-[14px] px-8 py-3 hover:text-[#DEE5FF] hover:bg-white/5 rounded transition-all">
                     Cancel
                  </button>
                  <button disabled={mutation.isPending} onClick={handleSave} className="bg-[#4EDEA3] text-[#004A31] font-inter font-bold text-[16px] px-10 py-3 rounded hover:bg-[#3dcd93] transition-colors shadow-[0_4px_15px_rgba(78,222,163,0.15)] truncate">
                     {mutation.isPending ? 'Saving...' : (isEditing ? 'Update Camera Node' : 'Save Camera Node')}
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
                     {[
                        { id: 'consumer', label: 'Consumer Analytics' },
                        { id: 'license_plate', label: 'License Plate detection' },
                        { id: 'security', label: 'Security analytics' }
                     ].map((module) => (
                        <label 
                           key={module.id}
                           onClick={() => setSelectedModule(module.label)} 
                           className={`flex items-center gap-4 bg-[#06122D] rounded px-4 py-3 cursor-pointer group hover:bg-[rgba(6,18,45,0.7)] transition-colors ${selectedModule === module.label ? 'border border-[rgba(78,222,163,0.2)]' : ''}`}
                        >
                           <div className={`w-[18px] h-[18px] flex items-center justify-center bg-black rounded-sm transition-colors flex-shrink-0 ${selectedModule === module.label ? 'border border-[#4EDEA3]' : 'border border-[rgba(43,70,128,0.4)] group-hover:border-[#4EDEA3]'}`}>
                              <Check size={12} className={`text-[#4EDEA3] ${selectedModule === module.label ? 'opacity-100' : 'opacity-0'}`} />
                           </div>
                           <span className="text-[#DEE5FF] font-inter font-semibold text-[14px]">{module.label}</span>
                        </label>
                     ))}
                  </div>
               </div>

               {/* Features */}
               <div className="bg-[#05183C] border border-[rgba(43,70,128,0.05)] rounded-lg p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                     <div className="text-[#FFB148]"><Settings2 size={18} strokeWidth={2.5} /></div>
                     <h3 className="text-[#DEE5FF] font-space font-semibold text-[16px]">Features</h3>
                  </div>

                  <div className="flex flex-col gap-5 w-full">
                     {currentFeatures.length === 0 ? (
                        <div className="flex items-center justify-center py-4 opacity-70">
                           <span className="text-[#91AAEB] font-inter text-[13px] italic">No configurable features needed.</span>
                        </div>
                     ) : (
                        currentFeatures.map((feature) => {
                           const isEnabled = featuresState[feature.id];
                           const Icon = feature.icon;
                           
                           return (
                              <div key={feature.id} className="flex flex-col gap-3 w-full group">
                                 <div className="flex items-center justify-between w-full cursor-pointer" onClick={() => toggleFeature(feature.id)}>
                                    <div className="flex items-center gap-3">
                                       <Icon size={14} className="text-[#91AAEB] group-hover:text-[#4EDEA3] transition-colors" />
                                       <span className="text-[#DEE5FF] font-inter text-[14px] group-hover:text-[#4EDEA3] transition-colors">{feature.label}</span>
                                    </div>
                                    <button type="button" className={`w-10 h-[22px] rounded-full flex items-center p-1 transition-colors ${isEnabled ? 'bg-[#005236]/50 justify-end shadow-inner border border-transparent' : 'bg-[#00225A] justify-start border border-[#2B4680]'}`}>
                                       <div className={`w-[14px] h-[14px] rounded-full transition-colors ${isEnabled ? 'bg-[#4EDEA3]' : 'bg-[#8F9FB7]'}`}></div>
                                    </button>
                                 </div>
                                 
                                 {feature.id === 'IN / OUT count' && isEnabled && (
                                    <button 
                                       type="button"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          setShowLineModal(true);
                                       }}
                                       className={`flex items-center justify-center gap-2 w-full py-2 rounded border border-dashed text-[12px] font-bold transition-all ${inOutConfig ? 'border-[#4EDEA3]/30 text-[#4EDEA3] bg-[#005236]/20' : 'border-[#91AAEB]/30 text-[#91AAEB] hover:border-[#4EDEA3] hover:text-[#4EDEA3]'}`}
                                    >
                                       <Check size={14} className={inOutConfig ? 'block' : 'hidden'} />
                                       {inOutConfig ? 'Line Configured' : 'Configure Crossing Line'}
                                    </button>
                                 )}
                              </div>
                           );
                        })
                     )}
                  </div>
               </div>

               {showLineModal && (
                  <LineSetupModal 
                     sourceUrl={sourceUrl}
                     initialConfig={inOutConfig}
                     onSave={(config) => {
                        setInOutConfig(config);
                        setShowLineModal(false);
                     }}
                     onCancel={() => setShowLineModal(false)}
                  />
               )}

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
               <button disabled={mutation.isPending} onClick={handleSave} className="bg-[#4EDEA3] text-[#004A31] w-full font-inter font-bold text-[16px] px-10 py-4 rounded hover:bg-[#3dcd93] transition-colors shadow-[0_4px_15px_rgba(78,222,163,0.15)] text-center">
                  {mutation.isPending ? 'Saving...' : (isEditing ? 'Update Node' : 'Save Node')}
               </button>
               <button onClick={onCancel} className="text-[#91AAEB] w-full font-inter font-bold text-[14px] px-8 py-4 hover:text-[#DEE5FF] hover:bg-white/5 rounded transition-all text-center">
                  Cancel
               </button>
            </div>

         </div>
      </div>
   );
}


function CameraRow({ id, idType, name, desc, location, status, statusType, sourceUrl, floor, date, isLast, onEdit, onDelete }) {
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
         <div className="px-4 flex justify-end gap-1">
            <button onClick={onEdit} className="text-[#91AAEB] hover:text-[#4EDEA3] p-2 rounded transition-all opacity-0 group-hover:opacity-100" title="Edit Camera">
               <Edit2 size={16} />
            </button>
            <button 
               onClick={() => {
                  if (window.confirm("Are you sure you want to delete this camera? This action cannot be undone.")) {
                     onDelete(id);
                  }
               }} 
               className="text-[#91AAEB] hover:text-[#EE7D77] p-2 rounded transition-all opacity-0 group-hover:opacity-100" 
               title="Delete Camera"
            >
               <Trash2 size={16} />
            </button>
         </div>

      </div>
   );
}
