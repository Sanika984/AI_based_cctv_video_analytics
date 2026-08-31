import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Download, Trash2, ShieldAlert, X, Image as ImageIcon } from 'lucide-react';
import {
  getBlacklistedVehicles,
  createBlacklistedVehicle,
  deleteBlacklistedVehicle,
  getVehicleLogs
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BlacklistTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch blacklisted vehicles from backend
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['blacklistedVehicles'],
    queryFn: getBlacklistedVehicles,
  });

  // Fetch recent blacklist detections from logs
  const { data: blacklistDetections = [] } = useQuery({
    queryKey: ['blacklistDetections'],
    queryFn: () => getVehicleLogs({ is_blacklisted: true, limit: 10 }),
    refetchInterval: 3000,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (newVehicle) => createBlacklistedVehicle(newVehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistedVehicles'] });
      setIsAddModalOpen(false);
      setPlateNumber('');
      setReason('');
      setErrorMessage('');
    },
    onError: (err) => {
      setErrorMessage(
        err.response?.data?.detail || 'Failed to add blacklisted vehicle.'
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBlacklistedVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklistedVehicles'] });
    },
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!plateNumber.trim()) {
      setErrorMessage('License plate number is required.');
      return;
    }
    createMutation.mutate({
      plate_number: plateNumber.trim().toUpperCase(),
      reason: reason.trim() || 'Unauthorized Vehicle',
      added_by: user?.username || 'Security Officer',
    });
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      !searchTerm ||
      v.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8000${url}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in transition-all">
      {/* Page Header & Action Bar */}
      <div className="flex flex-wrap justify-between items-center w-full gap-4">
        <div>
          <h2 className="text-[#DEE5FF] font-space font-bold text-[22px] tracking-wide">
            Blacklist Management
          </h2>
          <span className="text-[#91AAEB] text-[12px] font-inter">
            Manage hotlisted vehicle registration plates and real-time security trigger alerts.
          </span>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#4EDEA3] hover:bg-[#3dcd93] text-[#004A31] shadow-[0_0_20px_rgba(78,222,163,0.2)] rounded-lg px-5 py-2.5 flex items-center gap-2 font-inter font-bold text-[14px] transition-colors cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="flex flex-col xl:flex-row gap-6 w-full">
        {/* Left Column (Recent Detections) */}
        <div className="bg-[#06122D] rounded-lg p-5 w-full xl:w-[320px] flex-shrink-0 flex flex-col gap-4 border border-[rgba(43,70,128,0.15)] shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-[#8F9FB7] font-inter font-semibold text-[11px] tracking-[1.2px] uppercase">
              Recent Detections
            </h3>
            <span className="text-[#EE7D77] font-mono text-[10px] font-bold">
              {blacklistDetections.length} recorded
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {blacklistDetections.length === 0 ? (
              <div className="py-8 text-center text-[#91AAEB]/50 text-[12px] italic">
                No blacklisted vehicles detected yet.
              </div>
            ) : (
              blacklistDetections.slice(0, 4).map((det) => {
                const snapshotUrl = getFullImageUrl(det.snapshot_url);
                return (
                  <div
                    key={det.log_id}
                    className="bg-[#05183C] rounded-lg flex items-center p-3 gap-3 border border-[rgba(43,70,128,0.2)] hover:border-red-500/40 transition-colors"
                  >
                    <div className="bg-black w-[64px] h-[44px] rounded overflow-hidden flex-shrink-0 border border-white/5 flex items-center justify-center">
                      {snapshotUrl ? (
                        <img
                          src={snapshotUrl}
                          alt={det.plate_number}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon size={16} className="text-[#91AAEB]/40" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                      <div className="flex justify-between w-full items-center">
                        <span className="text-[#4EDEA3] font-mono font-bold text-[13px] leading-none">
                          {det.plate_number}
                        </span>
                        <span className="text-[#EE7D77] font-inter font-bold text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30">
                          Triggered
                        </span>
                      </div>
                      <div className="flex justify-between w-full items-center text-[10px] text-[#91AAEB] mt-1">
                        <span className="truncate max-w-[120px]">
                          {det.camera_name}
                        </span>
                        <span className="font-mono">
                          {det.entry_time
                            ? new Date(det.entry_time).toLocaleTimeString()
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (Table Area) */}
        <div className="bg-[#06122D] rounded-lg flex-1 flex flex-col border border-[rgba(43,70,128,0.15)] shadow-sm overflow-hidden">
          {/* Filter Header */}
          <div className="bg-[#05183C]/50 border-b border-[rgba(43,70,128,0.15)] px-6 py-4 flex flex-wrap justify-between items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-[320px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4EDEA3]">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter blacklisted plates..."
                className="bg-[#06122D] w-full border border-[rgba(43,70,128,0.3)] rounded-lg py-2 pl-10 pr-4 text-[13px] font-inter text-[#DEE5FF] placeholder:text-[#91AAEB]/50 focus:outline-none focus:border-[#4EDEA3]"
              />
            </div>
            <span className="text-[#91AAEB] font-mono text-[11px]">
              {filteredVehicles.length} registered
            </span>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-[12px] font-inter">
              <thead>
                <tr className="bg-[#05183C]/70 text-[#8F9FB7] border-b border-[rgba(43,70,128,0.15)] uppercase text-[10px] tracking-[1px]">
                  <th className="py-3 px-6">License Plate</th>
                  <th className="py-3 px-6">Reason / Watch Tag</th>
                  <th className="py-3 px-6">Date Added</th>
                  <th className="py-3 px-6">Added By</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(43,70,128,0.08)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-[#91AAEB]">
                      Loading blacklisted vehicles...
                    </td>
                  </tr>
                ) : filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-[#91AAEB]/60 italic">
                      No blacklisted vehicles found. Click &quot;Add New Vehicle&quot; to register one.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <span className="bg-[#00225A] border border-[rgba(78,222,163,0.3)] text-[#4EDEA3] font-mono font-bold text-[13px] px-2.5 py-1 rounded tracking-wider shadow-inner">
                          {vehicle.plate_number}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="bg-red-500/10 text-[#EE7D77] font-semibold text-[11px] tracking-wide uppercase px-2.5 py-1 rounded border border-red-500/20">
                          {vehicle.reason || 'Security Alert'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-[#91AAEB] font-mono text-[11px]">
                        {vehicle.added_at
                          ? new Date(vehicle.added_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-3.5 px-6 text-[#DEE5FF] font-medium text-[12px]">
                        {vehicle.added_by || 'Officer'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => deleteMutation.mutate(vehicle.id)}
                          disabled={deleteMutation.isPending}
                          className="text-[#EE7D77] hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove from blacklist"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New Blacklisted Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#05183C] border border-[rgba(43,70,128,0.3)] rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[rgba(43,70,128,0.2)] bg-[#06122D]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#EE7D77]" />
                <span className="text-[#DEE5FF] font-space font-bold text-[16px]">
                  Add Blacklisted Vehicle
                </span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#91AAEB] hover:text-[#DEE5FF] p-1 rounded transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 flex flex-col gap-4">
              {errorMessage && (
                <div className="bg-red-500/20 border border-red-500/40 text-[#EE7D77] text-[12px] p-2.5 rounded font-inter">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[#91AAEB] font-inter text-[12px] font-semibold">
                  License Plate Number *
                </label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="e.g. MH12AB1234 or KRG-9204"
                  className="bg-[#06122D] border border-[rgba(43,70,128,0.3)] rounded-lg p-2.5 text-[#DEE5FF] font-mono text-[14px] uppercase focus:outline-none focus:border-[#4EDEA3]"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#91AAEB] font-inter text-[12px] font-semibold">
                  Reason for Blacklisting
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Theft Suspect, Unauthorized Access, Wanted"
                  className="bg-[#06122D] border border-[rgba(43,70,128,0.3)] rounded-lg p-2.5 text-[#DEE5FF] font-inter text-[13px] focus:outline-none focus:border-[#4EDEA3]"
                />
              </div>

              <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-[rgba(43,70,128,0.2)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-transparent hover:bg-white/5 text-[#91AAEB] font-semibold text-[12px] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#EE7D77] hover:bg-[#ff8e88] text-[#2b0808] font-bold text-[12px] px-5 py-2 rounded-lg transition-colors cursor-pointer shadow"
                >
                  {createMutation.isPending ? 'Saving...' : 'Add to Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
