import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, ShieldAlert, X, CheckCircle2, Bell, AlertTriangle } from 'lucide-react';
import { getAlerts, acknowledgeAlert } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function InAppNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Poll for latest alerts every 2.5 seconds
  const { data: alerts } = useQuery({
    queryKey: ['securityAlerts'],
    queryFn: () => getAlerts({ limit: 10 }),
    refetchInterval: 2500,
  });

  const ackMutation = useMutation({
    mutationFn: (alertId) => acknowledgeAlert(alertId, user?.username || 'Operator'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['securityAlerts'] });
    },
  });

  // Find latest active unacknowledged alert that isn't dismissed
  const activeAlerts = alerts?.filter(
    (a) => a.status?.toLowerCase() === 'active' && !dismissedIds.has(a.alert_id)
  ) || [];

  const latestAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  const handleDismiss = (id) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const handleAcknowledge = (id) => {
    ackMutation.mutate(id);
    handleDismiss(id);
  };

  if (!latestAlert) return null;

  const isFire = latestAlert.alert_type?.toLowerCase() === 'fire';
  const isWeapon = latestAlert.alert_type?.toLowerCase() === 'weapon';
  const alertTitle = isFire ? 'Critical Fire Alert' : isWeapon ? 'Critical Weapon Threat' : 'Security Alert';

  return (
    <div className="fixed top-6 right-8 z-50 max-w-[420px] w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all ${
        isFire 
          ? 'bg-[#2b0808]/95 border-[#EE7D77] shadow-[0_0_25px_rgba(238,125,119,0.35)]' 
          : 'bg-[#261e05]/95 border-[#E5A93C] shadow-[0_0_25px_rgba(229,169,60,0.35)]'
      }`}>
        {/* Subtle pulsing background effect */}
        <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-30 ${
          isFire ? 'bg-red-500 animate-pulse' : 'bg-yellow-500 animate-pulse'
        }`} />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3 min-w-0">
            {/* Animated Threat Icon Badge */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
              isFire 
                ? 'bg-red-500/20 text-[#EE7D77] border-red-500/40 animate-bounce' 
                : 'bg-yellow-500/20 text-[#E5A93C] border-yellow-500/40 animate-bounce'
            }`}>
              {isFire ? <Flame size={22} className="fill-current" /> : <ShieldAlert size={22} />}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-space font-bold text-[13px] uppercase tracking-wider ${
                  isFire ? 'text-[#EE7D77]' : 'text-[#E5A93C]'
                }`}>
                  {alertTitle}
                </span>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              </div>

              <span className="text-[#DEE5FF] font-inter font-semibold text-[14px] truncate mt-0.5">
                {latestAlert.camera_name || latestAlert.camera_id}
              </span>
              <span className="text-[#91AAEB] font-inter text-[11px] truncate">
                Zone: <strong className="text-[#DEE5FF]">{latestAlert.location || 'General Area'}</strong>
              </span>
              {latestAlert.reference_id && (
                <span className="text-white/60 font-mono text-[10px] mt-0.5 truncate">
                  {latestAlert.reference_id}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => handleDismiss(latestAlert.alert_id)}
            className="text-[#91AAEB] hover:text-[#DEE5FF] p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3 relative z-10">
          <span className="text-[10px] font-mono text-white/50">
            {latestAlert.timestamp ? new Date(latestAlert.timestamp).toLocaleTimeString() : 'Just now'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDismiss(latestAlert.alert_id)}
              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[#91AAEB] hover:text-[#DEE5FF] rounded text-[11px] font-inter transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={() => handleAcknowledge(latestAlert.alert_id)}
              disabled={ackMutation.isPending}
              className={`px-3.5 py-1 rounded text-[11px] font-inter font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 ${
                isFire
                  ? 'bg-[#EE7D77] hover:bg-[#ff8f89] text-[#2b0808]'
                  : 'bg-[#E5A93C] hover:bg-[#ffbd4a] text-[#261e05]'
              }`}
            >
              <CheckCircle2 size={12} />
              <span>{ackMutation.isPending ? 'Saving...' : 'Acknowledge'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
