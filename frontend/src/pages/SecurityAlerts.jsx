import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Radio,
  RefreshCw,
  Sliders,
  Clock,
  ExternalLink,
  ChevronRight,
  Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import FeedCard from '../components/FeedCard';
import { getCameras, getAlerts, acknowledgeAlert, getSecurityStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SecurityAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'fire', 'weapon'

  // Fetch cameras
  const { data: cameras, isLoading: isLoadingCameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras,
  });

  // Fetch alerts with polling
  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['securityAlerts'],
    queryFn: () => getAlerts({ limit: 50 }),
    refetchInterval: 3000,
  });

  // Fetch live security inference status
  const { data: securityStatus } = useQuery({
    queryKey: ['securityStatus'],
    queryFn: getSecurityStatus,
    refetchInterval: 2000,
  });

  const ackMutation = useMutation({
    mutationFn: (alertId) => acknowledgeAlert(alertId, user?.username || 'Operator'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityAlerts'] });
    },
  });

  // Filter cameras configured for Fire Detection & Weapon Detection
  const onlineCameras = cameras?.filter((c) => c.status?.toLowerCase() === 'online') || [];

  const fireCameras = onlineCameras.filter(
    (c) =>
      c.module?.toLowerCase().includes('security') &&
      (c.features?.['Fire detection'] === true || c.features?.['Fire Detection'] === true)
  );

  const weaponCameras = onlineCameras.filter(
    (c) =>
      c.module?.toLowerCase().includes('security') &&
      (c.features?.['Weapon detection'] === true || c.features?.['Weapon Detection'] === true)
  );

  // Group alerts
  const fireAlerts = alerts?.filter((a) => a.alert_type?.toLowerCase() === 'fire') || [];
  const weaponAlerts = alerts?.filter((a) => a.alert_type?.toLowerCase() === 'weapon') || [];

  const activeFireAlerts = fireAlerts.filter((a) => a.status?.toLowerCase() === 'active');
  const activeWeaponAlerts = weaponAlerts.filter((a) => a.status?.toLowerCase() === 'active');
  const totalActive = (alerts || []).filter((a) => a.status?.toLowerCase() === 'active').length;

  // Check live detection status from cache
  const hasLiveFire = Object.values(securityStatus || {}).some((s) => s.fire_detected || s.is_active_alert);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] animate-in fade-in transition-all">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[#DEE5FF] font-space font-bold text-[24px] uppercase tracking-wider flex items-center gap-2.5">
            <ShieldAlert size={26} className="text-[#4EDEA3]" />
            Security Analytics
          </h2>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center bg-[#06122D] p-1 rounded-lg border border-[rgba(43,70,128,0.2)]">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-md text-[12px] font-inter font-semibold transition-all cursor-pointer ${activeTab === 'all'
              ? 'bg-[#4EDEA3] text-[#004A31] shadow-sm'
              : 'text-[#91AAEB] hover:text-[#DEE5FF]'
              }`}
          >
            All Cameras
          </button>
          <button
            onClick={() => setActiveTab('fire')}
            className={`px-4 py-1.5 rounded-md text-[12px] font-inter font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'fire'
              ? 'bg-[#EE7D77] text-[#2b0808] shadow-sm font-bold'
              : 'text-[#91AAEB] hover:text-[#EE7D77]'
              }`}
          >
            <Flame size={14} />
            <span>Fire ({fireCameras.length})</span>
            {activeFireAlerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('weapon')}
            className={`px-4 py-1.5 rounded-md text-[12px] font-inter font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'weapon'
              ? 'bg-[#E5A93C] text-[#261e05] shadow-sm font-bold'
              : 'text-[#91AAEB] hover:text-[#E5A93C]'
              }`}
          >
            <Shield size={14} />
            <span>Weapon ({weaponCameras.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Fire Threat Status */}
        <div className={`rounded-lg p-5 flex flex-col justify-between border transition-all ${activeFireAlerts.length > 0 || hasLiveFire
          ? 'bg-[#2b0808]/80 border-[#EE7D77] shadow-[0_0_20px_rgba(238,125,119,0.25)]'
          : 'bg-[#06122D] border-[rgba(43,70,128,0.15)]'
          }`}>
          <div className="flex justify-between items-center">
            <span className="text-[#91AAEB] font-inter font-semibold text-[11px] uppercase tracking-wider">Fire Threat Level</span>
            <Flame size={18} className={activeFireAlerts.length > 0 || hasLiveFire ? 'text-[#EE7D77] animate-bounce' : 'text-[#4EDEA3]'} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`font-space font-bold text-[24px] uppercase ${activeFireAlerts.length > 0 || hasLiveFire ? 'text-[#EE7D77]' : 'text-[#4EDEA3]'
              }`}>
              {activeFireAlerts.length > 0 || hasLiveFire ? 'CRITICAL FLAME' : 'ALL CLEAR'}
            </span>
          </div>
          <span className="text-[#91AAEB] font-inter text-[11px] mt-1">
            {activeFireAlerts.length} active incident(s)
          </span>
        </div>

        {/* Weapon Threat Status */}
        <div className={`rounded-lg p-5 flex flex-col justify-between border transition-all ${activeWeaponAlerts.length > 0
          ? 'bg-[#261e05]/80 border-[#E5A93C] shadow-[0_0_20px_rgba(229,169,60,0.25)]'
          : 'bg-[#06122D] border-[rgba(43,70,128,0.15)]'
          }`}>
          <div className="flex justify-between items-center">
            <span className="text-[#91AAEB] font-inter font-semibold text-[11px] uppercase tracking-wider">Perimeter Weapon Threat</span>
            <ShieldAlert size={18} className={activeWeaponAlerts.length > 0 ? 'text-[#E5A93C] animate-bounce' : 'text-[#4EDEA3]'} />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`font-space font-bold text-[24px] uppercase ${activeWeaponAlerts.length > 0 ? 'text-[#E5A93C]' : 'text-[#4EDEA3]'
              }`}>
              {activeWeaponAlerts.length > 0 ? 'THREAT DETECTED' : 'NORMAL'}
            </span>
          </div>
          <span className="text-[#91AAEB] font-inter text-[11px] mt-1">
            {activeWeaponAlerts.length} active incident(s)
          </span>
        </div>

        {/* Total Active Alerts */}
        <div className="bg-[#06122D] rounded-lg p-5 flex flex-col justify-between border border-[rgba(43,70,128,0.15)]">
          <div className="flex justify-between items-center">
            <span className="text-[#91AAEB] font-inter font-semibold text-[11px] uppercase tracking-wider">Active Unresolved</span>
            <AlertTriangle size={18} className={totalActive > 0 ? 'text-[#EE7D77]' : 'text-[#91AAEB]'} />
          </div>
          <div className="mt-3">
            <span className={`font-space font-bold text-[28px] ${totalActive > 0 ? 'text-[#EE7D77]' : 'text-[#DEE5FF]'}`}>
              {totalActive}
            </span>
          </div>
        </div>

        {/* Monitored Security Cameras */}
        <div className="bg-[#06122D] rounded-lg p-5 flex flex-col justify-between border border-[rgba(43,70,128,0.15)]">
          <div className="flex justify-between items-center">
            <span className="text-[#91AAEB] font-inter font-semibold text-[11px] uppercase tracking-wider">Security Feeds</span>
            <Camera size={18} className="text-[#4EDEA3]" />
          </div>
          <div className="mt-3">
            <span className="text-[#DEE5FF] font-space font-bold text-[28px]">
              {fireCameras.length + weaponCameras.length}
            </span>
          </div>
          <span className="text-[#4EDEA3] font-inter text-[11px] mt-1">AI Inference Workers Active</span>
        </div>
      </div>

      {/* SECTION 1: FIRE DETECTION */}
      {(activeTab === 'all' || activeTab === 'fire') && (
        <div className="flex flex-col gap-4 bg-[#05183C] border border-[rgba(43,70,128,0.15)] rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-[rgba(43,70,128,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-[#EE7D77]">
                <Flame size={20} className="fill-current" />
              </div>
              <div>
                <h3 className="text-[#DEE5FF] font-space font-bold text-[18px] uppercase tracking-wide">
                  Fire & Smoke Detection
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 ${activeFireAlerts.length > 0 || hasLiveFire
                ? 'bg-red-500/20 text-[#EE7D77] border-red-500/40 animate-pulse'
                : 'bg-[#004A31] text-[#4EDEA3] border-[#4EDEA3]/30'
                }`}>
                <span className={`w-2 h-2 rounded-full ${activeFireAlerts.length > 0 || hasLiveFire ? 'bg-red-500' : 'bg-[#4EDEA3]'}`} />
                {activeFireAlerts.length > 0 || hasLiveFire ? 'CRITICAL INCIDENT ACTIVE' : 'MONITORING NORMAL'}
              </span>
            </div>
          </div>

          {/* Fire Feeds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[220px]">
            {isLoadingCameras ? (
              <div className="col-span-2 flex items-center justify-center py-12 text-[#91AAEB]">
                Loading fire detection feeds...
              </div>
            ) : fireCameras.length > 0 ? (
              fireCameras.map((cam) => (
                <div key={cam.camera_id} className="h-[260px] relative rounded-lg overflow-hidden">
                  <FeedCard
                    cameraId={cam.camera_id}
                    title={cam.name}
                    fps={cam.processingFps || 5}
                  />
                  {/* Real-time Threat Badge overlay */}
                  {securityStatus?.[cam.camera_id]?.fire_detected && (
                    <div className="absolute top-3.5 right-3.5 z-20 px-2.5 py-1 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-mono font-bold rounded border border-red-400 animate-bounce flex items-center gap-1">
                      <Flame size={12} className="fill-current" />
                      <span>FLAME DETECTED</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-10 px-4 bg-[#06122D]/60 border border-dashed border-[rgba(43,70,128,0.25)] rounded-lg text-center gap-3">
                <Flame size={32} className="text-[#91AAEB]/40" />
                <span className="text-[#DEE5FF] font-inter font-semibold text-[14px]">
                  No cameras
                </span>
              </div>
            )}
          </div>

          {/* Fire Incident Logs Table */}
          <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-[rgba(43,70,128,0.15)]">
            <div className="flex justify-between items-center">
              <span className="text-[#DEE5FF] font-space font-semibold text-[13px] uppercase tracking-wider">
                Recent Alerts
              </span>
              <span className="text-[#91AAEB] font-mono text-[11px]">
                {fireAlerts.length} recorded events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] font-inter">
                <thead>
                  <tr className="bg-[#06122D] text-[#91AAEB] border-b border-[rgba(43,70,128,0.15)] uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Alert ID</th>
                    <th className="py-2.5 px-3">Camera / Area</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(43,70,128,0.08)]">
                  {fireAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-[#91AAEB]/60 italic">
                        No fire detection incidents recorded.
                      </td>
                    </tr>
                  ) : (
                    fireAlerts.slice(0, 5).map((a) => {
                      const isActive = a.status?.toLowerCase() === 'active';
                      return (
                        <tr key={a.alert_id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#DEE5FF]">
                            {a.alert_id}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#DEE5FF]">{a.camera_name}</span>
                              <span className="text-[#91AAEB] text-[11px]">{a.location}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-500/20 text-[#EE7D77] border border-red-500/30">
                              {a.severity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[#91AAEB] font-mono text-[11px]">
                            {a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isActive
                              ? 'bg-red-500/20 text-[#EE7D77] border border-red-500/40'
                              : 'bg-[#004A31] text-[#4EDEA3] border border-[#4EDEA3]/30'
                              }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isActive ? (
                              <button
                                onClick={() => ackMutation.mutate(a.alert_id)}
                                disabled={ackMutation.isPending}
                                className="px-2.5 py-1 bg-[#EE7D77] hover:bg-[#ff8f89] text-[#2b0808] font-bold rounded text-[10px] transition-colors cursor-pointer"
                              >
                                Acknowledge
                              </button>
                            ) : (
                              <span className="text-[#4EDEA3] text-[11px] font-mono">
                                Ack by {a.acknowledged_by || 'Operator'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WEAPON DETECTION */}
      {(activeTab === 'all' || activeTab === 'weapon') && (
        <div className="flex flex-col gap-4 bg-[#05183C] border border-[rgba(43,70,128,0.15)] rounded-xl p-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-[rgba(43,70,128,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-[#E5A93C]">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-[#DEE5FF] font-space font-bold text-[18px] uppercase tracking-wide">
                  Weapon Detection
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#004A31] text-[#4EDEA3] border border-[#4EDEA3]/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4EDEA3]" />
              CLEAR
            </span>
          </div>

          {/* Weapon Feeds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px]">
            {isLoadingCameras ? (
              <div className="col-span-2 flex items-center justify-center py-12 text-[#91AAEB]">
                Loading ...
              </div>
            ) : weaponCameras.length > 0 ? (
              weaponCameras.map((cam) => (
                <div key={cam.camera_id} className="h-[260px] relative rounded-lg overflow-hidden">
                  <FeedCard
                    cameraId={cam.camera_id}
                    title={cam.name}
                    fps={cam.processingFps || 5}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-2 flex flex-col items-center justify-center py-10 px-4 bg-[#06122D]/60 border border-dashed border-[rgba(43,70,128,0.25)] rounded-lg text-center gap-3">
                <Shield size={32} className="text-[#91AAEB]/40" />
                <span className="text-[#DEE5FF] font-inter font-semibold text-[14px]">
                  No cameras
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
