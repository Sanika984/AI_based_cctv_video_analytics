import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCameras, addCamera, updateCamera, deleteCamera, verifyStreamSource, getPreviewStreamUrl, stopStream } from '../services/api';
import {
   Plus, Search, Activity, WifiOff,
   ChevronLeft, ChevronRight, Info, Cpu, Settings2, Link,
   VideoOff, ArrowLeftRight, Clock, Map, Check, Flame, Crosshair, Edit2, Trash2, Camera as CameraIcon,
   Play, RefreshCw, CheckCircle2, AlertCircle, Loader2, Video, Radio, Square, Sliders
} from 'lucide-react';
import LineSetupModal from '../components/LineSetupModal';


const standardZones = [
   'Entrance',
   'Checkout',
   'Parking',
   'Aisle',
   'Perimeter',
   'Loading Dock',
   'Lobby'
];


export default function CameraConfig() {
   const queryClient = useQueryClient();
   const [isAdding, setIsAdding] = useState(false);
   const [editingCamera, setEditingCamera] = useState(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState('All');
   const [zoneFilter, setZoneFilter] = useState('All');

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

   const activeCameras = cameras?.filter(c => c.status === 'Online') || [];
   const offlineCameras = cameras?.filter(c => c.status === 'Offline') || [];
   const totalCamerasCount = cameras?.length || 0;
   const filteredCameras = cameras?.filter(camera => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
         camera.camera_id?.toLowerCase().includes(search) ||
         camera.name?.toLowerCase().includes(search) ||
         camera.zone?.toLowerCase().includes(search);

      const matchesStatus =
         statusFilter === 'All' || camera.status === statusFilter;

      const matchesZone =
         zoneFilter === 'All' || camera.zone === zoneFilter;

      return matchesSearch && matchesStatus && matchesZone;
   }) || [];

   return (
      <div className="flex flex-col w-full max-w-[1024px] animate-in fade-in transition-all pb-24">

         {/* Action Header */}
         <div className="flex justify-between items-center w-full mb-8">
            <div>
               <h1 className="text-[#DEE5FF] font-space font-bold text-[28px] tracking-tight">Camera Management</h1>
            </div>
            <button
               onClick={() => setIsAdding(true)}
               className="bg-[#4EDEA3] shadow-[0_4px_15px_rgba(78,222,163,0.15)] rounded-lg px-6 py-3 flex items-center gap-2 hover:bg-[#3dcd93] transition-colors relative group cursor-pointer"
            >
               <div className="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] border-[#004A31]">
                  <Plus size={14} className="text-[#004A31]" strokeWidth={3} />
               </div>
               <span className="text-[#004A31] font-inter font-bold text-[15px]">Add New Camera</span>
            </button>
         </div>

         {/* Stats Grid - 3 cards: Total, Active (Online), Offline */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">

            {/* Total Cameras */}
            <div className="bg-[#06122D] border border-[rgba(43,70,128,0.1)] rounded-lg p-5 flex flex-col gap-3 shadow-sm">
               <div className="flex justify-between items-start w-full">
                  <span className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[1.2px]">Total Configured</span>
                  <div className="text-[rgba(145,170,235,0.6)]">
                     <CameraIcon size={18} />
                  </div>
               </div>
               <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">{totalCamerasCount.toString().padStart(2, '0')}</span>
                  <span className="text-[#91AAEB] font-inter text-[13px]">Cameras</span>
               </div>
               <div className="w-full h-1 bg-[#00225A] rounded-full mt-auto">
                  <div className="h-full bg-[#91AAEB] rounded-full" style={{ width: '100%' }}></div>
               </div>
            </div>

            {/* Active Cameras (Online) */}
            <div className="bg-[#06122D] border border-[rgba(43,70,128,0.1)] rounded-lg p-5 flex flex-col gap-3 shadow-sm relative overflow-hidden">
               <div className="flex justify-between items-start w-full">
                  <span className="text-[#4EDEA3] font-inter font-bold text-[12px] uppercase tracking-[1.2px]">Online</span>
                  <div className="text-[rgba(78,222,163,0.6)]">
                     <Activity size={18} />
                  </div>
               </div>
               <div className="flex items-baseline gap-2 mt-1 mb-2">
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">{activeCameras.length.toString().padStart(2, '0')}</span>
                  <span className="text-[#91AAEB] font-space font-light text-[18px]">/ {totalCamerasCount}</span>
               </div>
               <div className="w-full h-1 bg-[#00225A] rounded-full mt-auto">
                  <div className="h-full bg-[#4EDEA3] rounded-full" style={{ width: `${totalCamerasCount ? (activeCameras.length / totalCamerasCount) * 100 : 0}%` }}></div>
               </div>
            </div>

            {/* System Offline */}
            <div className="bg-[#06122D] border border-[rgba(43,70,128,0.1)] rounded-lg p-5 flex flex-col gap-3 shadow-sm">
               <div className="flex justify-between items-start w-full">
                  <span className="text-[#EE7D77] font-inter font-bold text-[12px] uppercase tracking-[1.2px]">Offline</span>
                  <div className="text-[rgba(238,125,119,0.6)]">
                     <WifiOff size={18} />
                  </div>
               </div>
               <div className="flex items-baseline gap-2 mt-1 mb-2">
                  <span className="text-[#DEE5FF] font-space font-light text-[32px] leading-none">{offlineCameras.length.toString().padStart(2, '0')}</span>
                  <span className="text-[#91AAEB] font-space font-light text-[18px]">/ {totalCamerasCount}</span>
               </div>
               <div className="w-full h-1 bg-[#00225A] rounded-full mt-auto">
                  <div className="h-full bg-[#EE7D77] rounded-full" style={{ width: `${totalCamerasCount ? (offlineCameras.length / totalCamerasCount) * 100 : 0}%` }}></div>
               </div>
            </div>

         </div>

         {/* Camera List Table */}
         <div className="bg-[#05183C] rounded-2xl flex flex-col flex-1 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-[rgba(43,70,128,0.1)] overflow-hidden">

            {/* Header */}
            <div className="bg-[#031D4B] px-6 py-4 flex justify-between items-center border-b border-[rgba(43,70,128,0.1)] w-full">
               <h3 className="text-[#DEE5FF] font-space font-medium text-[16px]">Camera list</h3>

               <div className="flex items-center gap-3">

                  {/* Search */}
                  <div className="relative">
                     <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6F87B5]"
                     />

                     <input
                        type="text"
                        placeholder="Search cameras..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 pl-9 pr-3 py-2 bg-[#061F4F] border border-[#1B3566] rounded-lg text-sm text-[#DEE5FF] placeholder-[#6F87B5] focus:outline-none focus:border-[#4F7CFF]"
                     />
                  </div>

                  {/* Status Filter */}
                  <select
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value)}
                     className="px-3 py-2 bg-[#061F4F] border border-[#1B3566] rounded-lg text-sm text-[#DEE5FF] focus:outline-none focus:border-[#4F7CFF]"
                  >
                     <option value="All">All Status</option>
                     <option value="Online">Online</option>
                     <option value="Offline">Offline</option>
                  </select>

                  <select
                     value={zoneFilter}
                     onChange={(e) => setZoneFilter(e.target.value)}
                     className="px-3 py-2 bg-[#061F4F] border border-[#1B3566] rounded-lg text-sm text-[#DEE5FF] focus:outline-none focus:border-[#4F7CFF]"
                  >
                     <option value="All">All Zones</option>
                     {standardZones.map((zone) => (
                        <option key={zone} value={zone}>
                           {zone}
                        </option>
                     ))}
                  </select>


               </div>
            </div>

            {/* Table Container */}
            <div className="w-full flex-1 flex flex-col overflow-x-auto min-h-[300px]">
               {/* Column Headers: 5 Columns */}
               <div className="grid grid-cols-[120px_2.5fr_1.5fr_130px_80px] bg-[rgba(6,18,45,0.5)] border-b border-[rgba(43,70,128,0.1)] items-center px-6 py-4 w-full min-w-[620px]">
                  <div className="text-[#91AAEB] font-inter font-bold text-[11px] uppercase tracking-[1.2px]">Camera ID</div>
                  <div className="text-[#91AAEB] font-inter font-bold text-[11px] uppercase tracking-[1.2px]">Camera Name</div>
                  <div className="text-[#91AAEB] font-inter font-bold text-[11px] uppercase tracking-[1.2px]">Zone / Area</div>
                  <div className="text-[#91AAEB] font-inter font-bold text-[11px] uppercase tracking-[1.2px]">Status</div>
                  <div className="text-[#91AAEB] font-inter font-bold text-[11px] uppercase tracking-[1.2px] text-right">Actions</div>
               </div>

               {/* Rows */}
               <div className="flex flex-col w-full min-w-[620px]">
                  {isLoading && (
                     <div className="w-full flex justify-center py-12">
                        <span className="text-[#91AAEB] font-inter text-[14px]">Loading cameras...</span>
                     </div>
                  )}
                  {isError && (
                     <div className="w-full flex justify-center py-12">
                        <span className="text-[#EE7D77] font-inter text-[14px]">Failed to load cameras. Backend might be unreachable.</span>
                     </div>
                  )}
                  {!isLoading && !isError && cameras?.length === 0 && (
                     <div className="w-full flex flex-col items-center justify-center py-16 gap-3">
                        <CameraIcon size={36} className="text-[#91AAEB]/40" />
                        <span className="text-[#91AAEB] font-inter text-[14px]">No cameras configured yet. Click "Add New Camera" to get started.</span>
                     </div>
                  )}
                  {!isLoading && filteredCameras?.map((camera, index) => {
                     const isOnline = camera.status === 'Online';

                     return (
                        <CameraRow
                           key={camera.camera_id}
                           id={camera.camera_id}
                           isOnline={isOnline}
                           name={camera.name}
                           zone={camera.zone || 'General'}
                           status={camera.status}
                           onEdit={() => setEditingCamera(camera)}
                           onDelete={(id) => deleteMutation.mutate(id)}
                           isLast={index === filteredCameras.length - 1}
                        />
                     );
                  })}
                  {!isLoading && filteredCameras.length === 0 && (
                     <div className="py-12 text-center text-[#91AAEB]">
                        <p className="text-sm font-medium text-[#DEE5FF]">
                           No cameras found
                        </p>
                        <p className="text-xs mt-1">
                           Try changing your search or filter.
                        </p>
                     </div>
                  )}
               </div>
            </div>

            {/* Pagination Footer */}
            <div className="bg-[#031D4B] px-6 py-[14px] border-t border-[rgba(43,70,128,0.1)] flex justify-between items-center mt-auto">
               <span className="text-[#91AAEB] font-inter text-[12px]">Showing <strong className="text-[#DEE5FF] font-medium">{filteredCameras?.length || 0}</strong> {filteredCameras?.length === 1 ? 'camera' : 'cameras'}</span>
               <div className="flex gap-1.5">
                  <button className="w-8 h-8 flex items-center justify-center bg-black rounded-sm border border-transparent hover:border-[#2B4680] text-[#8F9FB7] hover:text-[#DEE5FF] transition-all">
                     <ChevronLeft size={16} />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center bg-[#4EDEA3] rounded-sm text-[#004A31] font-inter text-[12px] font-medium shadow-sm">
                     1
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


function AddCameraForm({ initialData, onCancel, onSuccess }) {
   const queryClient = useQueryClient();
   const [name, setName] = useState(initialData?.name || '');
   const initZone = initialData?.zone || 'Entrance';
   const isCustomInitial = !standardZones.includes(initZone);
   const [zone, setZone] = useState(isCustomInitial ? 'Custom' : initZone);
   const [customZoneText, setCustomZoneText] = useState(isCustomInitial ? initZone : '');
   const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '');
   const [status, setStatus] = useState(initialData?.status || 'Online');
   const [processingFps, setProcessingFps] = useState(initialData?.processingFps || 5);

   // Stream Verification & Preview States
   const [isCheckingStream, setIsCheckingStream] = useState(false);
   const [streamVerified, setStreamVerified] = useState(false);
   const [streamError, setStreamError] = useState(null);
   const [streamInfo, setStreamInfo] = useState(null);
   const [previewKey, setPreviewKey] = useState(Date.now());

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

   // Ensure any active stream preview / hardware webcam capture is released when form closes/unmounts
   useEffect(() => {
      return () => {
         stopStream();
      };
   }, []);

   const handleStopPreview = () => {
      setStreamVerified(false);
      setStreamInfo(null);
      setStreamError(null);
      stopStream();
   };

   const toggleFeature = (featureId) => {
      setFeaturesState(prev => ({ ...prev, [featureId]: !prev[featureId] }));
   };

   const currentFeatures = moduleFeatures[selectedModule] || [];

   const handleTestStream = async (urlToTest = sourceUrl) => {
      const cleanUrl = (urlToTest || '').trim();
      if (!cleanUrl) {
         setStreamError('Please enter a source URL, RTSP link, or webcam index (0).');
         setStreamVerified(false);
         setStreamInfo(null);
         return;
      }

      setIsCheckingStream(true);
      setStreamError(null);
      setStreamVerified(false);

      try {
         const res = await verifyStreamSource(cleanUrl);
         if (res.success) {
            setStreamVerified(true);
            setStreamInfo(res);
            setPreviewKey(Date.now());
         } else {
            setStreamVerified(false);
            setStreamError(res.message || 'Could not connect to camera stream.');
            setStreamInfo(null);
         }
      } catch (err) {
         setStreamVerified(false);
         setStreamError(err.response?.data?.detail || 'Network error while connecting to camera stream.');
         setStreamInfo(null);
      } finally {
         setIsCheckingStream(false);
      }
   };

   const handleUseDemoVideo = () => {
      const demoPath = 'data/videos/p.mp4';
      setSourceUrl(demoPath);
      if (streamVerified) {
         handleStopPreview();
      } else {
         setStreamError(null);
         setStreamInfo(null);
      }
   };

   const handleFormCancel = () => {
      handleStopPreview();
      onCancel();
   };

   const mutation = useMutation({
      mutationFn: isEditing ? updateCamera : addCamera,
      onSuccess: () => {
         handleStopPreview();
         queryClient.invalidateQueries({ queryKey: ['cameras'] });
         onCancel();
      }
   });

   const handleSave = () => {
      const selectedZone = zone === 'Custom' ? (customZoneText.trim() || 'General') : zone;
      const payload = {
         name: name.trim(),
         zone: selectedZone,
         sourceUrl,
         module: selectedModule,
         features: featuresState,
         status,
         processingFps: Number(processingFps) || 5,
         inOutConfig
      };
      if (isEditing) {
         mutation.mutate({ id: initialData.camera_id, cameraData: payload });
      } else {
         mutation.mutate(payload);
      }
   };

   return (
      <div className="flex flex-col w-full max-w-[1024px] animate-in fade-in slide-in-from-bottom-4 transition-all pb-32 gap-8 mt-2">

         {/* Page Header */}
         <div className="flex w-full">
            <h2 className="text-[#DEE5FF] font-space font-bold text-[32px] tracking-[-0.8px]">{isEditing ? 'Edit Camera Configuration' : 'Initialize New Camera'}</h2>
         </div>

         {/* Layout Grid */}
         <div className="flex flex-col lg:flex-row gap-6 w-full">

            {/* LEFT COLUMN: Camera Details */}
            <div className="flex flex-col flex-1 gap-6 min-w-0">

               <div className="bg-[rgba(0,34,90,0.4)] backdrop-blur-md border border-[rgba(43,70,128,0.3)] rounded-lg p-6 md:p-8 flex flex-col gap-6 shadow-sm">
                  <div className="flex items-center gap-3">
                     <div className="text-[#4EDEA3]"><Info size={20} strokeWidth={2.5} /></div>
                     <h3 className="text-[#DEE5FF] font-space font-semibold text-[18px]">Camera Details</h3>
                  </div>

                  {/* Camera Name & Zone */}
                  <div className="flex flex-col md:flex-row gap-6 w-full">
                     {/* Camera Name */}
                     <div className="flex flex-col gap-2.5 flex-1 w-full">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">
                           Camera Name
                        </label>
                        <input
                           value={name}
                           onChange={e => setName(e.target.value)}
                           type="text"
                           placeholder="e.g. Entrance Cam 1, Cashier 2 Overlook, North Gate Overhead"
                           className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter placeholder:text-[#6B7280] focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner"
                        />
                     </div>

                     {/* Location / Zone */}
                     <div className="flex flex-col gap-2.5 w-full md:w-[220px]">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">
                           Zone / Location
                        </label>
                        <div className="relative flex items-center group">
                           <select
                              value={zone}
                              onChange={e => setZone(e.target.value)}
                              className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 pr-10 text-[14px] text-[#DEE5FF] font-inter focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner appearance-none cursor-pointer"
                           >
                              {standardZones.map(z => (
                                 <option key={z} value={z}>{z}</option>
                              ))}
                              <option value="Custom">Custom Zone...</option>
                           </select>
                           <div className="absolute right-4 text-[#91AAEB] pointer-events-none group-focus-within:text-[#4EDEA3] transition-colors">
                              <ChevronRight size={14} className="rotate-90" />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Custom Zone Field */}
                  {zone === 'Custom' && (
                     <div className="flex flex-col gap-2.5 w-full animate-in fade-in">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">
                           Custom Zone Name
                        </label>
                        <input
                           value={customZoneText}
                           onChange={e => setCustomZoneText(e.target.value)}
                           type="text"
                           placeholder="e.g. Storage Rooftop, Delivery Bay 3"
                           className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 text-[14px] text-[#DEE5FF] font-inter focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner"
                        />
                     </div>
                  )}

                  {/* Initial Status */}
                  <div className="flex flex-col gap-2.5 w-full">
                     <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px]">
                        Initial Status
                     </label>
                     <div className="relative flex items-center group">
                        <select
                           value={status}
                           onChange={e => setStatus(e.target.value)}
                           className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] px-4 pr-10 text-[14px] text-[#DEE5FF] font-inter focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner appearance-none cursor-pointer"
                        >
                           <option value="Online">Online</option>
                           <option value="Offline">Offline</option>
                        </select>
                        <div className="absolute right-4 text-[#91AAEB] pointer-events-none group-focus-within:text-[#4EDEA3] transition-colors">
                           <ChevronRight size={14} className="rotate-90" />
                        </div>
                     </div>
                  </div>

                  {/* Stream URL & Demo Action */}
                  <div className="flex flex-col gap-3 w-full pt-2 border-t border-[rgba(43,70,128,0.15)]">
                     <div className="flex flex-wrap justify-between items-center gap-2 w-full">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px] flex items-center gap-2">
                           <Radio size={14} className="text-[#4EDEA3]" />
                           Source Feed URL / Path / Webcam
                        </label>
                        
                        {/* Single Clean Demo Video Action */}
                        <button
                           type="button"
                           onClick={handleUseDemoVideo}
                           className={`px-3 py-1.5 rounded-md text-[12px] font-inter font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                              sourceUrl === 'data/videos/p.mp4'
                                 ? 'bg-[#004A31] text-[#4EDEA3] border border-[#4EDEA3]/50 shadow-sm'
                                 : 'bg-[#00225A] text-[#DEE5FF] hover:bg-[#003080] border border-white/10 hover:border-[#4EDEA3]/40'
                           }`}
                           title="Fill demo video path (data/videos/p.mp4)"
                        >
                           <Video size={13} className="text-[#4EDEA3]" />
                           <span>Use Demo Video</span>
                        </button>
                     </div>

                     {/* Input and Test Button */}
                     <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                        <div className="relative flex items-center flex-1 group">
                           <div className="absolute left-4 text-[#91AAEB] group-focus-within:text-[#4EDEA3] transition-colors"><Link size={14} /></div>
                           <input
                              value={sourceUrl}
                              onChange={e => {
                                 setSourceUrl(e.target.value);
                                 if (streamVerified) {
                                    handleStopPreview();
                                 } else {
                                    setStreamError(null);
                                    setStreamInfo(null);
                                 }
                              }}
                              type="text"
                              placeholder="0 for webcam, rtsp:// link, or click 'Use Demo Video'"
                              className="bg-black border border-[rgba(43,70,128,0.2)] rounded w-full h-[46px] pl-10 pr-4 text-[14px] text-[#DEE5FF] font-mono focus:border-[#4EDEA3] focus:outline-none transition-colors shadow-inner"
                           />
                        </div>

                        <button
                           type="button"
                           onClick={() => handleTestStream()}
                           disabled={isCheckingStream}
                           className={`h-[46px] px-5 rounded-lg font-inter font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 ${
                              streamVerified
                                 ? 'bg-[#004A31] text-[#4EDEA3] border border-[#4EDEA3]/50 hover:bg-[#005c3d]'
                                 : 'bg-[#4EDEA3] text-[#004A31] hover:bg-[#3dcd93] shadow-[0_2px_10px_rgba(78,222,163,0.2)]'
                           } disabled:opacity-50`}
                        >
                           {isCheckingStream ? (
                              <>
                                 <Loader2 size={16} className="animate-spin text-current" />
                                 <span>Verifying...</span>
                              </>
                           ) : streamVerified ? (
                              <>
                                 <CheckCircle2 size={16} className="text-[#4EDEA3]" />
                                 <span>Verified & Live</span>
                              </>
                           ) : (
                              <>
                                 <Play size={15} className="fill-current" />
                                 <span>Test & Preview</span>
                              </>
                           )}
                        </button>
                     </div>

                     {/* Verification Feedback Banner */}
                     {streamVerified && streamInfo && (
                        <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-[#002b1c] border border-[#4EDEA3]/30 rounded-md text-[12px] text-[#4EDEA3] font-inter animate-in fade-in">
                           <div className="flex items-center gap-2.5">
                              <CheckCircle2 size={16} className="shrink-0 text-[#4EDEA3]" />
                              <div className="flex items-center gap-2">
                                 <span className="font-semibold">Stream Verified & Active</span>
                                 <span className="bg-black/40 text-[#4EDEA3] px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                                    {streamInfo.fps ? `${streamInfo.fps} FPS` : '30 FPS'}
                                 </span>
                              </div>
                           </div>
                           <button
                              type="button"
                              onClick={handleStopPreview}
                              className="px-2.5 py-1 bg-[#2a0b0b] hover:bg-[#3d1212] text-[#EE7D77] border border-[#EE7D77]/40 rounded text-[10px] font-inter font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                              title="Stop active preview stream and release webcam"
                           >
                              <Square size={10} className="fill-current" />
                              <span>Stop Feed</span>
                           </button>
                        </div>
                     )}

                     {streamError && (
                        <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-[#2a0b0b] border border-[#EE7D77]/40 rounded-md text-[12px] text-[#EE7D77] font-inter animate-in fade-in">
                           <AlertCircle size={16} className="shrink-0 text-[#EE7D77] mt-0.5" />
                           <div className="flex flex-col gap-0.5">
                              <span className="font-semibold">Connection Check Failed</span>
                              <span className="text-[#DEE5FF]/80 text-[11px]">{streamError}</span>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Model Sampling Rate (3 Simple Options) */}
                  <div className="flex flex-col gap-2.5 w-full pt-2 border-t border-[rgba(43,70,128,0.15)]">
                     <div className="flex justify-between items-center">
                        <label className="text-[#91AAEB] font-inter font-bold text-[12px] uppercase tracking-[0.6px] flex items-center gap-2">
                           <Sliders size={14} className="text-[#4EDEA3]" />
                           Model Sampling Rate
                        </label>
                        <span className="text-[#4EDEA3] font-mono text-[11px] font-semibold">{processingFps} FPS</span>
                     </div>

                     <div className="grid grid-cols-3 gap-2 w-full">
                        {[
                           { value: 2, label: '2 FPS', desc: 'Low' },
                           { value: 5, label: '5 FPS', desc: 'Standard' },
                           { value: 10, label: '10 FPS', desc: 'Fast' },
                        ].map(opt => (
                           <button
                              key={opt.value}
                              type="button"
                              onClick={() => setProcessingFps(opt.value)}
                              className={`py-2 px-2.5 rounded border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                                 processingFps === opt.value
                                    ? 'bg-[#004A31] border-[#4EDEA3] text-[#4EDEA3] shadow-sm'
                                    : 'bg-black/30 border-[rgba(43,70,128,0.2)] text-[#8F9FB7] hover:border-[#4EDEA3]/30 hover:text-[#DEE5FF]'
                              }`}
                           >
                              <span className="font-space font-bold text-[13px]">{opt.label}</span>
                              <span className="text-[10px] font-inter opacity-75">{opt.desc}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Form Actions (Desktop) */}
               <div className="hidden lg:flex justify-end items-center gap-4 pt-4 mt-auto">
                  <button onClick={handleFormCancel} className="text-[#91AAEB] font-inter font-bold text-[14px] px-8 py-3 hover:text-[#DEE5FF] hover:bg-white/5 rounded transition-all cursor-pointer">
                     Cancel
                  </button>
                  <button disabled={mutation.isPending} onClick={handleSave} className="bg-[#4EDEA3] text-[#004A31] font-inter font-bold text-[15px] px-10 py-3 rounded hover:bg-[#3dcd93] transition-colors shadow-[0_4px_15px_rgba(78,222,163,0.15)] truncate cursor-pointer">
                     {mutation.isPending ? 'Saving...' : (isEditing ? 'Update Camera' : 'Save Camera')}
                  </button>
               </div>

            </div>

            {/* RIGHT COLUMN: Modules & Features */}
            <div className="flex flex-col gap-6 w-full lg:w-[320px] shrink-0">

               {/* Intelligence Modules */}
               <div className="bg-[#05183C] border border-[rgba(43,70,128,0.1)] rounded-lg p-6 flex flex-col gap-5">
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
                           className={`flex items-center gap-4 bg-[#06122D] rounded px-4 py-3 cursor-pointer group hover:bg-[rgba(6,18,45,0.7)] transition-colors ${selectedModule === module.label ? 'border border-[rgba(78,222,163,0.3)]' : 'border border-transparent'}`}
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
               <div className="bg-[#05183C] border border-[rgba(43,70,128,0.1)] rounded-lg p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                     <div className="text-[#4EDEA3]"><Settings2 size={18} strokeWidth={2.5} /></div>
                     <h3 className="text-[#DEE5FF] font-space font-semibold text-[16px]">Features</h3>
                  </div>

                  <div className="flex flex-col gap-4 w-full">
                     {currentFeatures.length === 0 ? (
                        <div className="flex items-center justify-center py-4 opacity-70">
                           <span className="text-[#91AAEB] font-inter text-[13px] italic">No configurable features needed.</span>
                        </div>
                     ) : (
                        currentFeatures.map((feature) => {
                           const isEnabled = featuresState[feature.id];
                           const Icon = feature.icon;

                           return (
                              <div key={feature.id} className="flex flex-col gap-2.5 w-full group">
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
                                       className={`flex items-center justify-center gap-2 w-full py-2 rounded border border-dashed text-[12px] font-bold transition-all cursor-pointer ${inOutConfig ? 'border-[#4EDEA3]/40 text-[#4EDEA3] bg-[#005236]/30' : 'border-[#91AAEB]/30 text-[#91AAEB] hover:border-[#4EDEA3] hover:text-[#4EDEA3]'}`}
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

               {/* Live Stream Preview Monitor Card */}
               <div className="bg-[#05183C] border border-[rgba(43,70,128,0.2)] rounded-lg p-5 flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-center w-full">
                     <div className="flex items-center gap-2">
                        <Video size={16} className="text-[#4EDEA3]" />
                        <h4 className="text-[#DEE5FF] font-space font-semibold text-[14px] uppercase tracking-wide">Stream Preview</h4>
                     </div>
                     {streamVerified ? (
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#004A31] border border-[#4EDEA3]/40 rounded text-[10px] font-mono text-[#4EDEA3] font-bold tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4EDEA3] animate-pulse"></span>
                              LIVE
                           </div>
                           <button
                              type="button"
                              onClick={handleStopPreview}
                              className="px-2 py-0.5 bg-[#2a0b0b] hover:bg-[#3d1212] text-[#EE7D77] border border-[#EE7D77]/40 rounded text-[10px] font-inter font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              title="Stop Preview"
                           >
                              <Square size={9} className="fill-current" />
                              <span>Stop</span>
                           </button>
                        </div>
                     ) : isCheckingStream ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#3a2800] border border-[#E5A93C]/40 rounded text-[10px] font-mono text-[#E5A93C] font-bold tracking-wider">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C] animate-ping"></span>
                           TESTING
                        </div>
                     ) : (
                        <span className="text-[#91AAEB]/50 font-mono text-[10px] uppercase">STANDBY</span>
                     )}
                  </div>

                  {/* Monitor Screen Frame */}
                  <div className="bg-black border border-[rgba(43,70,128,0.3)] rounded-lg min-h-[170px] max-h-[220px] flex flex-col justify-center items-center overflow-hidden relative shadow-inner">
                     
                     {/* Background Scanlines */}
                     <div
                        className="absolute inset-0 opacity-[0.04] pointer-events-none z-10"
                        style={{
                           backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)`
                        }}
                     ></div>

                     {streamVerified ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black group">
                           <img
                              src={`${getPreviewStreamUrl(sourceUrl)}&t=${previewKey}`}
                              alt="Stream Live Feed"
                              className="w-full h-full max-h-[220px] object-cover"
                              onError={() => {
                                 setStreamVerified(false);
                                 setStreamError("Stream video frame playback encountered an error.");
                              }}
                           />
                           {/* HUD Overlay */}
                           <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-black/75 backdrop-blur-sm border border-[#4EDEA3]/40 rounded text-[10px] font-mono text-[#4EDEA3] font-bold">
                                 {streamInfo?.fps ? `${streamInfo.fps} FPS` : '30 FPS'}
                              </span>
                           </div>

                           {/* Quick Action Buttons on Hover */}
                           <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                              <button
                                 type="button"
                                 onClick={handleStopPreview}
                                 className="px-2.5 py-1 bg-[#2a0b0b]/90 hover:bg-[#3d1212] text-[#EE7D77] border border-[#EE7D77]/40 rounded text-[11px] font-inter flex items-center gap-1.5 backdrop-blur-sm cursor-pointer transition-colors shadow-lg"
                                 title="Stop preview stream"
                              >
                                 <Square size={11} className="fill-current" />
                                 <span>Stop</span>
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setPreviewKey(Date.now())}
                                 className="px-2.5 py-1 bg-black/80 hover:bg-[#00225A] text-[#DEE5FF] hover:text-[#4EDEA3] border border-white/20 rounded text-[11px] font-inter flex items-center gap-1.5 backdrop-blur-sm cursor-pointer transition-colors shadow-lg"
                                 title="Reload stream frame"
                              >
                                 <RefreshCw size={11} />
                                 <span>Refresh</span>
                              </button>
                           </div>
                        </div>
                     ) : isCheckingStream ? (
                        <div className="flex flex-col justify-center items-center gap-3 p-6 text-center z-10">
                           <Loader2 size={30} className="text-[#4EDEA3] animate-spin" />
                           <div className="flex flex-col gap-1">
                              <span className="text-[#DEE5FF] font-inter font-bold text-[12px] tracking-wide uppercase">Connecting to Feed...</span>
                              <span className="text-[#91AAEB] font-mono text-[10px]">Testing stream connection</span>
                           </div>
                        </div>
                     ) : streamError ? (
                        <div className="flex flex-col justify-center items-center gap-2 p-5 text-center z-10">
                           <AlertCircle size={26} className="text-[#EE7D77]" />
                           <span className="text-[#DEE5FF] font-inter font-bold text-[11px] tracking-wide uppercase">Signal Unavailable</span>
                           <p className="text-[#91AAEB] font-inter text-[10px] leading-tight max-w-[90%] line-clamp-2">{streamError}</p>
                           <button
                              type="button"
                              onClick={() => handleTestStream()}
                              className="mt-1 px-3 py-1 bg-[#2a0b0b] hover:bg-[#3d1212] text-[#EE7D77] border border-[#EE7D77]/40 rounded text-[10px] font-inter font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                           >
                              <RefreshCw size={10} />
                              <span>Retry Connection</span>
                           </button>
                        </div>
                     ) : (
                        <div className="flex flex-col justify-center items-center gap-2 p-5 text-center z-10">
                           <VideoOff size={26} className="text-[#91AAEB]/60 mb-0.5" strokeWidth={1.5} />
                           <span className="text-[#DEE5FF] font-inter font-bold text-[11px] tracking-[1.2px] uppercase">Standby Monitor</span>
                           <span className="text-[#91AAEB] font-inter text-[10px] leading-relaxed max-w-[85%]">
                              Enter <strong>0</strong> for webcam, an RTSP link, or click <strong>Use Demo Video</strong>, then click <strong>Test & Preview</strong>.
                           </span>
                           <button
                              type="button"
                              onClick={() => handleTestStream()}
                              className="mt-1.5 px-3.5 py-1.5 bg-[#00225A] hover:bg-[#003080] text-[#4EDEA3] border border-[#4EDEA3]/30 rounded text-[11px] font-inter font-bold transition-all cursor-pointer flex items-center gap-1.5"
                           >
                              <Play size={11} className="fill-current" />
                              <span>Test Stream Now</span>
                           </button>
                        </div>
                     )}
                  </div>
               </div>

            </div>

            {/* Form Actions (Mobile) */}
            <div className="flex lg:hidden flex-col items-center gap-3 mt-4">
               <button disabled={mutation.isPending} onClick={handleSave} className="bg-[#4EDEA3] text-[#004A31] w-full font-inter font-bold text-[16px] px-10 py-4 rounded hover:bg-[#3dcd93] transition-colors shadow-[0_4px_15px_rgba(78,222,163,0.15)] text-center cursor-pointer">
                  {mutation.isPending ? 'Saving...' : (isEditing ? 'Update Camera' : 'Save Camera')}
               </button>
               <button onClick={handleFormCancel} className="text-[#91AAEB] w-full font-inter font-bold text-[14px] px-8 py-4 hover:text-[#DEE5FF] hover:bg-white/5 rounded transition-all text-center cursor-pointer">
                  Cancel
               </button>
            </div>

         </div>
      </div>
   );
}


function CameraRow({ id, isOnline, name, zone, status, isLast, onEdit, onDelete }) {
   return (
      <div className={`grid grid-cols-[120px_2.5fr_1.5fr_130px_80px] items-center px-6 py-4 ${isLast ? '' : 'border-b border-[rgba(43,70,128,0.05)]'} hover:bg-[#06122D]/60 transition-colors group`}>

         {/* ID */}
         <div className="pr-4">
            <span className={`px-2.5 py-1 rounded-[3px] font-mono text-[11px] font-bold tracking-wider inline-block ${isOnline ? 'bg-[#00225A] text-[#4EDEA3] border border-[rgba(78,222,163,0.25)]' : 'bg-[#001844] border border-[rgba(43,70,128,0.3)] text-[#91AAEB]'
               }`}>
               {id}
            </span>
         </div>

         {/* Name (Friendly Label) */}
         <div className="pr-4">
            <span className="text-[#DEE5FF] font-inter font-semibold text-[14px] group-hover:text-[#4EDEA3] transition-colors block truncate">{name}</span>
         </div>

         {/* Zone Badge */}
         <div className="pr-4">
            <span className="bg-[#00225A] text-[#91AAEB] border border-[#2B4680]/40 px-2.5 py-1 rounded text-[11px] font-medium font-inter inline-block tracking-wide">
               {zone}
            </span>
         </div>

         {/* Status */}
         <div className="flex items-center gap-2 pr-4 whitespace-nowrap">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#4EDEA3] shadow-[0_0_8px_rgba(78,222,163,0.6)]' : 'bg-[#EE7D77]'}`}></div>
            <span className={`font-inter font-semibold text-[12px] tracking-[0.5px] ${isOnline ? 'text-[#4EDEA3]' : 'text-[#EE7D77]'
               }`}>
               {status}
            </span>
         </div>

         {/* Actions */}
         <div className="flex justify-end gap-1">
            <button onClick={onEdit} className="text-[#91AAEB] hover:text-[#4EDEA3] p-1.5 rounded hover:bg-white/5 transition-all cursor-pointer opacity-0 group-hover:opacity-100" title="Edit Camera">
               <Edit2 size={16} />
            </button>
            <button
               onClick={() => {
                  if (window.confirm("Are you sure you want to delete this camera? This action cannot be undone.")) {
                     onDelete(id);
                  }
               }}
               className="text-[#91AAEB] hover:text-[#EE7D77] p-1.5 rounded hover:bg-white/5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
               title="Delete Camera"
            >
               <Trash2 size={16} />
            </button>
         </div>

      </div>
   );
}
