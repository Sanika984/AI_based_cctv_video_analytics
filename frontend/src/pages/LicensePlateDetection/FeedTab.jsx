import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Image as ImageIcon,
  ShieldAlert,
  Car,
  AlertTriangle,
  X,
  Eye,
  ScanLine
} from 'lucide-react';
import FeedCard from '../../components/FeedCard';
import {
  getCameras,
  getVehicleStats,
  getVehicleLogs,
  getAlerts,
  acknowledgeAlert,
  getLicensePlateStatus
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FeedTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [previewSnapshot, setPreviewSnapshot] = useState(null);

  // Fetch cameras
  const { data: cameras = [], isLoading: isLoadingCameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras,
  });

  // Fetch vehicle stats
  const { data: stats } = useQuery({
    queryKey: ['vehicleStats'],
    queryFn: getVehicleStats,
    refetchInterval: 3000,
  });

  // Fetch recent vehicle logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['vehicleLogs'],
    queryFn: () => getVehicleLogs({ limit: 12 }),
    refetchInterval: 3000,
  });

  // Fetch blacklist alerts
  const { data: blacklistAlerts = [] } = useQuery({
    queryKey: ['blacklistAlerts'],
    queryFn: () => getAlerts({ alert_type: 'blacklist', limit: 5 }),
    refetchInterval: 3000,
  });

  // Fetch live detection status
  const { data: lpdStatus = {} } = useQuery({
    queryKey: ['lpdStatus'],
    queryFn: getLicensePlateStatus,
    refetchInterval: 2000,
  });

  // Acknowledge mutation
  const ackMutation = useMutation({
    mutationFn: (alertId) =>
      acknowledgeAlert(alertId, user?.username || 'Operator'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistAlerts'] });
    },
  });

  // Filter cameras configured for License Plate Detection
  const onlineCameras = cameras.filter(
    (c) => c.status?.toLowerCase() === 'online'
  );

  const lpdCameras = onlineCameras.filter(
    (c) =>
      c.module?.toLowerCase().includes('license') ||
      c.module?.toLowerCase().includes('vehicle') ||
      c.features?.['License plate detection'] === true ||
      c.features?.['License Plate detection'] === true ||
      c.features?.['License Plate Detection'] === true
  );

  // If no camera specifically has the feature flag yet, display online cameras so user sees feeds immediately
  const displayCameras = lpdCameras.length > 0 ? lpdCameras : onlineCameras.slice(0, 2);

  const activeBlacklistAlerts = blacklistAlerts.filter(
    (a) => a.status?.toLowerCase() === 'active' || a.status?.toLowerCase() === 'open'
  );

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8000${url}`;
  };

  // Helper to determine if plate is high confidence (>= 70%)
  const isConfidentPlate = (plate, conf) => {
    if (!plate || plate === '-' || plate === 'UNKNOWN') return false;
    if (conf !== undefined && conf !== null && conf < 0.70) return false;
    return true;
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full animate-in fade-in transition-all">
      {/* Left Main Column */}
      <div className="flex flex-col flex-[2] gap-6 min-w-[632px]">
        {/* KPI Stats Bar - Exactly 2 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {/* Card 1: Plates Detected */}
          <div className="bg-[#06122D] rounded-xl p-4 px-6 flex items-center justify-between border border-[rgba(43,70,128,0.2)] shadow-sm hover:border-[#4EDEA3]/30 transition-colors">
            <div className="flex flex-col justify-center">
              <span className="text-[#91AAEB] font-inter font-semibold text-[11px] tracking-[1.2px] uppercase mb-1">
                Plates Detected
              </span>
              <span className="text-[#4EDEA3] font-space font-bold text-[30px] leading-none">
                {stats?.total_plates_detected ?? stats?.total_vehicles ?? 0}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#4EDEA3]/10 border border-[#4EDEA3]/25 flex items-center justify-center text-[#4EDEA3] flex-shrink-0">
              <ScanLine size={24} />
            </div>
          </div>

          {/* Card 2: Blacklist Count */}
          <div className="bg-[#06122D] rounded-xl p-4 px-6 flex items-center justify-between border border-[rgba(43,70,128,0.2)] shadow-sm hover:border-red-500/30 transition-colors">
            <div className="flex flex-col justify-center">
              <span className="text-[#91AAEB] font-inter font-semibold text-[11px] tracking-[1.2px] uppercase mb-1">
                Blacklist Detections
              </span>
              <span
                className={`font-space font-bold text-[30px] leading-none ${
                  (stats?.blacklist_count || 0) > 0
                    ? 'text-[#EE7D77]'
                    : 'text-[#DEE5FF]'
                }`}
              >
                {stats?.blacklist_count ?? 0}
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                (stats?.blacklist_count || 0) > 0
                  ? 'bg-red-500/15 border-red-500/30 text-[#EE7D77]'
                  : 'bg-white/5 border-white/10 text-[#91AAEB]'
              }`}
            >
              <ShieldAlert size={24} />
            </div>
          </div>
        </div>

        {/* Live Feeds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[240px]">
          {isLoadingCameras ? (
            <div className="col-span-2 flex items-center justify-center py-12 text-[#91AAEB]">
              Loading camera feeds...
            </div>
          ) : displayCameras.length > 0 ? (
            displayCameras.map((cam) => {
              const camState = lpdStatus[cam.camera_id];
              const hasLivePlate = camState?.plate_detected;
              const isBlacklisted = camState?.is_blacklisted;
              const livePlateConf = camState?.confidence || 0;
              const hasConfidentText = isConfidentPlate(camState?.plate_number, livePlateConf);

              return (
                <div
                  key={cam.camera_id}
                  className="h-[250px] relative rounded-xl overflow-hidden border border-[rgba(43,70,128,0.2)] shadow-sm"
                >
                  <FeedCard
                    cameraId={cam.camera_id}
                    title={cam.name}
                    fps={cam.processingFps || 5}
                  />

                  {/* Real-time License Plate Detection Badge Overlay */}
                  {hasLivePlate && (
                    <div
                      className={`absolute top-3.5 right-3.5 z-20 px-2.5 py-1 rounded text-[10px] font-mono font-bold border backdrop-blur-md animate-bounce flex items-center gap-1.5 ${
                        isBlacklisted
                          ? 'bg-red-600/90 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                          : 'bg-[#00225A]/90 text-[#4EDEA3] border-[#4EDEA3] shadow-[0_0_10px_rgba(78,222,163,0.3)]'
                      }`}
                    >
                      <Car size={12} />
                      <span>
                        {isBlacklisted
                          ? 'BLACKLIST'
                          : hasConfidentText
                          ? `PLATE: ${camState.plate_number}`
                          : 'PLATE DETECTED'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-2 flex flex-col items-center justify-center py-12 px-4 bg-[#06122D]/60 border border-dashed border-[rgba(43,70,128,0.25)] rounded-xl text-center gap-3">
              <Car size={32} className="text-[#91AAEB]/40" />
              <span className="text-[#DEE5FF] font-inter font-semibold text-[14px]">
                No cameras configured for License Plate Detection
              </span>
            </div>
          )}
        </div>

        {/* Recent Logs Table (Status column removed, snapshot column added) */}
        <div className="bg-[#05183C] rounded-xl flex flex-col border border-[rgba(43,70,128,0.18)] shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-[rgba(43,70,128,0.18)] bg-[#06122D]/70">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#4EDEA3] w-[4px] h-[16px] rounded-sm" />
              <span className="text-[#DEE5FF] font-space font-bold text-[15px] uppercase tracking-wider">
                Recent Detection Logs
              </span>
            </div>
            <span className="text-[#91AAEB] font-mono text-[11px]">
              {recentLogs.length} events logged
            </span>
          </div>

          <div className="flex flex-col w-full flex-1">
            {/* Table Header */}
            <div className="flex items-center bg-[#06122D] px-6 py-3 uppercase text-[#91AAEB] text-[10px] font-bold tracking-[1px] border-b border-[rgba(43,70,128,0.1)]">
              <div className="w-[100px] flex-shrink-0">Snapshot</div>
              <div className="flex-[1.2]">License Plate</div>
              <div className="flex-1">Camera / Location</div>
              <div className="flex-[0.9]">Timestamp</div>
              <div className="flex-[0.8] text-right">Confidence</div>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-10 text-center text-[#91AAEB]/60 italic text-[12px]">
                No recent vehicle entries logged.
              </div>
            ) : (
              recentLogs.slice(0, 6).map((log) => {
                const confPct = Math.round((log.confidence_score || 0) * 100);
                const isConfident = isConfidentPlate(log.plate_number, log.confidence_score);
                const isBlacklisted = isConfident && log.is_blacklisted;
                const snapshotUrl = getFullImageUrl(log.snapshot_url);

                return (
                  <div
                    key={log.log_id}
                    className="flex items-center px-6 py-3 border-b border-[rgba(43,70,128,0.08)] hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Plate Frame Grab Thumbnail */}
                    <div className="w-[100px] flex-shrink-0">
                      {snapshotUrl ? (
                        <div
                          onClick={() => setPreviewSnapshot(log)}
                          className="w-[84px] h-[38px] bg-black rounded border border-[rgba(43,70,128,0.4)] overflow-hidden cursor-pointer hover:border-[#4EDEA3] hover:scale-105 transition-all flex items-center justify-center group relative shadow-inner"
                          title="Click to inspect raw camera frame grab"
                        >
                          <img
                            src={snapshotUrl}
                            alt={isConfident ? log.plate_number : 'Vehicle snapshot'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye size={14} className="text-[#4EDEA3]" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-[84px] h-[38px] bg-black/40 border border-dashed border-[rgba(43,70,128,0.3)] rounded flex items-center justify-center text-[#91AAEB]/40">
                          <ImageIcon size={14} />
                        </div>
                      )}
                    </div>

                    {/* License Plate Number (Show plate only if high confidence >= 70%, else show "-") */}
                    <div className="flex-[1.2] flex items-center gap-2">
                      {isConfident ? (
                        <>
                          <span
                            className={`font-mono font-bold text-[13px] px-2.5 py-0.5 rounded border tracking-wider ${
                              isBlacklisted
                                ? 'bg-red-500/20 text-[#EE7D77] border-red-500/40 shadow-[0_0_8px_rgba(238,125,119,0.15)]'
                                : 'bg-[#00225A] text-[#4EDEA3] border-[#2B4680]'
                            }`}
                          >
                            {log.plate_number}
                          </span>
                          {isBlacklisted && (
                            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-[#EE7D77] border border-red-500/30">
                              Blacklist
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-mono text-[#91AAEB]/50 font-bold text-[14px] px-3 py-0.5 select-none">
                          -
                        </span>
                      )}
                    </div>

                    {/* Camera Name & Location */}
                    <div className="flex-1 flex flex-col overflow-hidden pr-2">
                      <span className="text-[#DEE5FF] text-[12px] font-medium truncate">
                        {log.camera_name}
                      </span>
                      <span className="text-[#91AAEB]/70 text-[10px] truncate">
                        {log.location}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex-[0.9] text-[#91AAEB] font-mono text-[12px]">
                      {log.entry_time
                        ? new Date(log.entry_time).toLocaleTimeString()
                        : '-'}
                    </div>

                    {/* Confidence Score Bar */}
                    <div className="flex-[0.8] flex items-center justify-end gap-2">
                      <div className="w-14 bg-[#06122D] h-2 rounded-full overflow-hidden border border-[rgba(43,70,128,0.2)]">
                        <div
                          className={`h-full rounded-full ${
                            confPct >= 80
                              ? 'bg-[#4EDEA3]'
                              : confPct >= 70
                              ? 'bg-emerald-400'
                              : confPct >= 50
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                          }`}
                          style={{ width: `${confPct}%` }}
                        />
                      </div>
                      <span className="text-[#DEE5FF] font-mono text-[11px] font-bold">
                        {confPct}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6 w-[330px] flex-shrink-0">
        {/* Blacklist Alerts Panel */}
        <div className="bg-[#7F2927]/10 border border-[#EE7D77]/30 rounded-xl p-5 flex flex-col gap-4 shadow-[0_0_15px_rgba(238,125,119,0.05)]">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#EE7D77] p-1.5 rounded-md">
              <ShieldAlert size={18} className="text-[#490106]" />
            </div>
            <span className="text-[#EE7D77] font-space font-bold text-[16px] tracking-[0.5px]">
              BLACKLIST ALERTS
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {activeBlacklistAlerts.length === 0 ? (
              <div className="bg-black/30 border border-[#2B4680]/20 rounded-lg p-4 text-center text-[#91AAEB]/70 text-[12px]">
                No active blacklist threats detected.
              </div>
            ) : (
              activeBlacklistAlerts.map((alert) => {
                const refLog = recentLogs.find((l) => l.log_id === alert.reference_id);
                const refPlate = isConfidentPlate(refLog?.plate_number, refLog?.confidence_score)
                  ? refLog.plate_number
                  : 'TARGET';

                return (
                  <div
                    key={alert.alert_id}
                    className="bg-black/50 border border-[#EE7D77]/30 backdrop-blur-md rounded-lg p-3.5 flex flex-col gap-3 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[#EE7D77] font-bold text-[10px] tracking-[1px] uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        Active Alert
                      </span>
                      <span className="text-[#91AAEB] text-[10px] font-mono">
                        {alert.timestamp
                          ? new Date(alert.timestamp).toLocaleTimeString()
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <div className="bg-[#00225A] border border-[#2B4680] text-[#DEE5FF] font-mono font-bold text-[13px] px-2.5 py-1 rounded">
                        {alert.reference_id ? refPlate : 'BLACKLISTED'}
                      </div>
                      <span className="text-[#DEE5FF] text-[11px] truncate">
                        {alert.camera_name}
                      </span>
                    </div>
                    <div className="flex gap-2 w-full mt-1">
                      <button
                        onClick={() => ackMutation.mutate(alert.alert_id)}
                        disabled={ackMutation.isPending}
                        className="w-full bg-[#EE7D77] hover:bg-[#ff8e88] text-[#490106] font-bold text-[10px] tracking-[0.5px] py-1.5 rounded uppercase transition-colors cursor-pointer shadow"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Plate Frame Grabs Feed (Shows full recent captures with click-to-preview) */}
        <div className="bg-[#05183C] rounded-xl p-5 flex flex-col gap-4 border border-[rgba(43,70,128,0.18)] shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-[#4EDEA3]">
                <ImageIcon size={18} strokeWidth={2} />
              </span>
              <span className="text-[#DEE5FF] font-space font-bold text-[15px]">
                Frame Grabs Feed
              </span>
            </div>
            <span className="text-[#91AAEB] font-mono text-[10px]">
              {recentLogs.length} snapshots
            </span>
          </div>

          <div className="text-[11px] text-[#91AAEB]/70 font-inter">
            Raw camera snapshots for each logged vehicle. Click any snapshot to inspect full image.
          </div>

          {/* Scrollable list of frame grabs */}
          <div className="grid grid-cols-2 gap-3 w-full max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {recentLogs.map((log) => {
              const snapshotUrl = getFullImageUrl(log.snapshot_url);
              const isConfident = isConfidentPlate(log.plate_number, log.confidence_score);
              const isBlacklisted = isConfident && log.is_blacklisted;

              return (
                <div
                  key={log.log_id}
                  onClick={() => setPreviewSnapshot(log)}
                  className={`flex flex-col gap-1.5 p-2 rounded-lg bg-[#06122D] border transition-all cursor-pointer group hover:scale-[1.02] ${
                    isBlacklisted
                      ? 'border-red-500/40 hover:border-red-400 bg-red-950/10'
                      : 'border-[rgba(43,70,128,0.25)] hover:border-[#4EDEA3]'
                  }`}
                  title="Click to view full snapshot"
                >
                  <div className="bg-black rounded aspect-[4/3] w-full overflow-hidden flex items-center justify-center shadow-inner relative">
                    {snapshotUrl ? (
                      <img
                        src={snapshotUrl}
                        alt={isConfident ? log.plate_number : 'Vehicle snapshot'}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Car size={24} className="text-[#91AAEB]/30" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye size={16} className="text-[#4EDEA3]" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span
                      className={`font-mono font-bold text-[12px] text-center w-full truncate ${
                        isConfident
                          ? isBlacklisted
                            ? 'text-[#EE7D77]'
                            : 'text-[#4EDEA3]'
                          : 'text-[#91AAEB]/50 font-normal'
                      }`}
                    >
                      {isConfident ? log.plate_number : '-'}
                    </span>
                    <div className="flex justify-between items-center text-[9px] text-[#91AAEB] font-mono px-0.5">
                      <span className="truncate max-w-[65px]">{log.camera_name}</span>
                      <span>
                        {log.entry_time
                          ? new Date(log.entry_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {recentLogs.length === 0 && (
              <div className="col-span-2 py-8 text-center text-[#91AAEB]/50 text-[11px] italic">
                No plate frame grabs recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Preview Modal Dialog for Visual Verification */}
      {previewSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#05183C] border border-[rgba(43,70,128,0.35)] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[rgba(43,70,128,0.2)] bg-[#06122D]">
              <div className="flex items-center gap-2.5">
                <ImageIcon size={18} className="text-[#4EDEA3]" />
                <span className="text-[#DEE5FF] font-space font-bold text-[16px]">
                  Frame Grab Visual Verification
                </span>
              </div>
              <button
                onClick={() => setPreviewSnapshot(null)}
                className="text-[#91AAEB] hover:text-[#DEE5FF] p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Image & Info */}
            <div className="p-6 flex flex-col items-center gap-4 bg-black/40">
              <div className="w-full max-h-[280px] bg-black rounded-xl border border-[rgba(43,70,128,0.3)] overflow-hidden flex items-center justify-center p-3 shadow-inner">
                <img
                  src={getFullImageUrl(previewSnapshot.snapshot_url)}
                  alt={previewSnapshot.plate_number || 'Snapshot'}
                  className="max-h-[260px] w-auto object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Informative banner on raw frame vs OCR */}
              <div className="w-full bg-[#06122D]/90 border border-[rgba(43,70,128,0.25)] rounded-lg p-2.5 text-[11px] text-[#91AAEB] flex items-center gap-2">
                <Eye size={16} className="text-[#4EDEA3] flex-shrink-0" />
                <span>
                  Inspect the raw frame grab snapshot above to read the license plate directly from the image.
                </span>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="bg-[#06122D] p-3 rounded-lg border border-[rgba(43,70,128,0.15)] flex flex-col">
                  <span className="text-[#91AAEB] text-[10px] uppercase font-mono">
                    OCR Detected Plate
                  </span>
                  <span
                    className={`font-mono font-bold text-[16px] ${
                      isConfidentPlate(previewSnapshot.plate_number, previewSnapshot.confidence_score)
                        ? previewSnapshot.is_blacklisted
                          ? 'text-[#EE7D77]'
                          : 'text-[#4EDEA3]'
                        : 'text-[#91AAEB]/60'
                    }`}
                  >
                    {isConfidentPlate(previewSnapshot.plate_number, previewSnapshot.confidence_score)
                      ? previewSnapshot.plate_number
                      : '-'}
                  </span>
                </div>
                <div className="bg-[#06122D] p-3 rounded-lg border border-[rgba(43,70,128,0.15)] flex flex-col">
                  <span className="text-[#91AAEB] text-[10px] uppercase font-mono">
                    Detection Confidence
                  </span>
                  <span className="text-[#DEE5FF] font-mono font-bold text-[16px]">
                    {Math.round((previewSnapshot.confidence_score || 0) * 100)}%
                  </span>
                </div>
                <div className="bg-[#06122D] p-3 rounded-lg border border-[rgba(43,70,128,0.15)] flex flex-col">
                  <span className="text-[#91AAEB] text-[10px] uppercase font-mono">
                    Camera &amp; Location
                  </span>
                  <span className="text-[#DEE5FF] font-inter font-semibold text-[12px] truncate">
                    {previewSnapshot.camera_name} ({previewSnapshot.location})
                  </span>
                </div>
                <div className="bg-[#06122D] p-3 rounded-lg border border-[rgba(43,70,128,0.15)] flex flex-col">
                  <span className="text-[#91AAEB] text-[10px] uppercase font-mono">
                    Logged Timestamp
                  </span>
                  <span className="text-[#DEE5FF] font-mono text-[11px]">
                    {previewSnapshot.entry_time
                      ? new Date(previewSnapshot.entry_time).toLocaleString()
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[rgba(43,70,128,0.2)] bg-[#06122D] flex justify-end">
              <button
                onClick={() => setPreviewSnapshot(null)}
                className="bg-[#004A31] hover:bg-[#006342] text-[#4EDEA3] font-semibold text-[12px] px-5 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
