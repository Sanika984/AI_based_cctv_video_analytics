import React from 'react';
import { ShieldAlert, Users, CheckCircle } from 'lucide-react';


export default function AlertItem({ type, title, time, desc }) {
    const configs = {
        error: { bg: 'bg-[#7f2927]/20', border: 'border-[#EE7D77]', color: 'text-[#EE7D77]', icon: ShieldAlert },
        warn: { bg: 'bg-[#f8a010]/10', border: 'border-[#FFB148]', color: 'text-[#FFB148]', icon: Users },
        success: { bg: 'bg-[#05183C]', border: 'border-[#4EDEA3]', color: 'text-[#DEE5FF]', icon: CheckCircle },
    };

    const colors = {
        error: '#EE7D77',
        warn: '#FFB148',
        success: '#4EDEA3'
    };

    const cColor = colors[type];
    const Icon = configs[type].icon;

    return (
        <div className={`p-3 rounded flex gap-3 border-l-[4px] ${configs[type].border} ${configs[type].bg}`}>
            <Icon size={14} color={cColor} className="mt-0.5 shrink-0" strokeWidth={2.5} />
            <div className="flex flex-col w-full gap-1">
                <div className="flex justify-between items-center w-full">
                    <span className={`font-inter font-bold text-[12px] uppercase ${configs[type].color}`}>{title}</span>
                    <span className="font-inter text-[#91AAEB] text-[9px]">{time}</span>
                </div>
                <p className="font-inter text-[#91AAEB] text-[11px] leading-[18px]">
                    {desc}
                </p>
            </div>
        </div>
    )
}