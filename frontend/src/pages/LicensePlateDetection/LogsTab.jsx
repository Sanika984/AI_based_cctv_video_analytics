import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Download,
  ShieldAlert,
  Image as ImageIcon,
  X,
  Camera,
  Clock,
  Car,
  Eye
} from 'lucide-react';
import { getVehicleLogs, getCameras } from '../../services/api';

export default function LogsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('all');
  const [blacklistFilter, setBlacklistFilter] = useState('all'); // 'all', 'blacklisted', 'normal'
  const [previewSnapshot, setPreviewSnapshot] = useState(null);

  // Fetch cameras for dropdown filter
  const { data: cameras } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras,
  });

  // Fetch real vehicle logs with polling
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['vehicleLogs'],
    queryFn: () => getVehicleLogs({ limit: 100 }),
    refetchInterval: 3000,
  });

  // Helper to determine if plate is high confidence (>= 70%)
  const isConfidentPlate = (plate, conf) => {
    if (!plate || plate === '-' || plate === 'UNKNOWN') return false;
    if (conf !== undefined && conf !== null && conf < 0.70) return false;
    return true;
  };

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
    const isConfident = isConfidentPlate(log.plate_number, log.confidence_score);
    const displayPlate = isConfident ? log.plate_number : '-';

    const matchesSearch =
      !searchTerm ||
      displayPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.camera_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCamera =
      selectedCamera === 'all' || log.camera_id === selectedCamera;

    const isBlacklisted = isConfident && log.is_blacklisted;
    const matchesBlacklist =
      blacklistFilter === 'all' ||
      (blacklistFilter === 'blacklisted' && isBlacklisted) ||
      (blacklistFilter === 'normal' && !isBlacklisted);

    return matchesSearch && matchesCamera && matchesBlacklist;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Log ID', 'Plate Number', 'Camera Name', 'Location', 'Timestamp', 'Confidence', 'Blacklisted', 'Snapshot URL'];
    const rows = filteredLogs.map((l) => {
      const isConfident = isConfidentPlate(l.plate_number, l.confidence_score);
      return [
        l.log_id,
        isConfident ? l.plate_number : '-',
        l.camera_name,
        l.location,
        l.entry_time,
        `${Math.round((l.confidence_score || 0) * 100)}%`,
        (isConfident && l.is_blacklisted) ? 'YES' : 'NO',
        l.snapshot_url ? `http://localhost:8000${l.snapshot_url}` : 'N/A'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `license_plate_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8000${url}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in transition-all">
      {/* Top Filter & Action Bar */}
      <div className="bg-[#06122D] border border-[rgba(43,70,128,0.18)] rounded-xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-[320px]">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4EDEA3]">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plate or camera..."
            className="w-full bg-[#05183C] border border-[rgba(43,70,128,0.3)] rounded-lg py-2.5 pl-10 pr-4 text-[13px] font-inter text-[#DEE5FF] placeholder:text-[#91AAEB]/50 focus:outline-none focus:border-[#4EDEA3] transition-colors"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Camera Filter */}
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="bg-[#05183C] border border-[rgba(43,70,128,0.3)] text-[#DEE5FF] text-[12px] font-inter rounded-lg px-3 py-2 focus:outline-none focus:border-[#4EDEA3] transition-colors cursor-pointer"
          >
            <option value="all">All Cameras</option>
            {cameras?.map((c) => (
              <option key={c.camera_id} value={c.camera_id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Blacklist Filter */}
          <div className="flex bg-[#05183C] p-0.5 rounded-lg border border-[rgba(43,70,128,0.3)]">
            <button
              onClick={() => setBlacklistFilter('all')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-inter font-medium transition-all ${
                blacklistFilter === 'all'
                  ? 'bg-[#4EDEA3] text-[#004A31] font-bold shadow-sm'
                  : 'text-[#91AAEB] hover:text-[#DEE5FF]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setBlacklistFilter('blacklisted')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-inter font-medium transition-all ${
                blacklistFilter === 'blacklisted'
                  ? 'bg-[#EE7D77] text-[#2b0808] font-bold shadow-sm'
                  : 'text-[#91AAEB] hover:text-[#EE7D77]'
              }`}
            >
              Blacklisted
            </button>
            <button
              onClick={() => setBlacklistFilter('normal')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-inter font-medium transition-all ${
                blacklistFilter === 'normal'
                  ? 'bg-[#4EDEA3] text-[#004A31] font-bold shadow-sm'
                  : 'text-[#91AAEB] hover:text-[#DEE5FF]'
              }`}
            >
              Standard
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-[#004A31] hover:bg-[#006342] text-[#4EDEA3] border border-[#4EDEA3]/30 px-3.5 py-2 rounded-lg text-[12px] font-inter font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#05183C] border border-[rgba(43,70,128,0.18)] rounded-xl overflow-hidden shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[rgba(43,70,128,0.18)] bg-[#06122D]/70">
          <div className="flex items-center gap-2.5">
            <Car size={18} className="text-[#4EDEA3]" />
            <span className="text-[#DEE5FF] font-space font-bold text-[15px] uppercase tracking-wider">
              Vehicle Detection &amp; ANPR Logs
            </span>
          </div>
          <span className="text-[#91AAEB] font-mono text-[11px]">
            {filteredLogs.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px] font-inter">
            <thead>
              <tr className="bg-[#06122D] text-[#91AAEB] border-b border-[rgba(43,70,128,0.15)] uppercase text-[10px] tracking-wider">
                <th className="py-3 px-5">Plate Snapshot</th>
                <th className="py-3 px-5">License Plate</th>
                <th className="py-3 px-5">Camera / Location</th>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(43,70,128,0.08)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-[#91AAEB]">
                    Loading vehicle logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-[#91AAEB]/60 italic">
                    No license plate detection logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const confPct = Math.round((log.confidence_score || 0) * 100);
                  const isConfident = isConfidentPlate(log.plate_number, log.confidence_score);
                  const isBlacklisted = isConfident && log.is_blacklisted;
                  const snapshotUrl = getFullImageUrl(log.snapshot_url);

                  return (
                    <tr
                      key={log.log_id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Snapshot Thumbnail */}
                      <td className="py-3 px-5">
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
                      </td>

                      {/* License Plate Text */}
                      <td className="py-3 px-5">
                        {isConfident ? (
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-[14px] px-3 py-1 rounded border tracking-wider ${
                                isBlacklisted
                                  ? 'bg-red-500/20 text-[#EE7D77] border-red-500/40 shadow-[0_0_10px_rgba(238,125,119,0.2)]'
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
                          </div>
                        ) : (
                          <span className="font-mono text-[#91AAEB]/50 font-bold text-[14px] px-3 py-1 select-none">
                            -
                          </span>
                        )}
                      </td>

                      {/* Camera / Location */}
                      <td className="py-3 px-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#DEE5FF]">
                            {log.camera_name}
                          </span>
                          <span className="text-[#91AAEB] text-[11px]">
                            {log.location}
                          </span>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-5 text-[#91AAEB] font-mono text-[11px]">
                        {log.entry_time
                          ? new Date(log.entry_time).toLocaleString()
                          : '-'}
                      </td>

                      {/* Confidence Score */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-[#06122D] h-2 rounded-full overflow-hidden border border-[rgba(43,70,128,0.2)]">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Preview Modal Dialog for Visual OCR Verification */}
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

            {/* Modal Image Box */}
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

              {/* Metadata Details */}
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
