import React from 'react';

const PagePlaceholder = ({ title, desc }) => (
  <div className="flex-1 w-full h-full flex flex-col items-center justify-center border border-[rgba(43,70,128,0.3)] bg-[#05183C]/20 rounded-xl border-dashed">
    <h2 className="text-2xl font-semibold text-brand-text mb-2">{title}</h2>
    <p className="text-brand-sub text-sm uppercase tracking-widest">{desc}</p>
  </div>
);

export { default as LiveStream } from './LiveStream';
export { default as ConsumerAnalytics } from './ConsumerAnalytics';
export { default as LicensePlateDetection } from './LicensePlateDetection';
export { default as SecurityAlerts } from './SecurityAlerts';
export { default as CameraConfig } from './CameraConfig';
export { default as UserManagement } from './UserManagement';
export { default as Profile } from './Profile';
export { default as Login } from './Login';

export const Support = () => <PagePlaceholder title="Support Helpdesk" desc="Documentation Placeholder" />;
export const Logs = () => <PagePlaceholder title="System Logs" desc="Log View Placeholder" />;
