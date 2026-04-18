import React from 'react';

export default function FeedCard({ title }) {
   return (
      <div className="bg-[#162C5D]/30 relative rounded-lg w-full h-full flex overflow-hidden border border-[rgba(43,70,128,0.2)]">
         {/* Gradient Overlay */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#06122D]/60 to-[#06122D]/20 z-0"></div>

         {/* Top left Active Pill */}
         <div className="absolute top-4 left-4 bg-[rgba(0,34,90,0.6)] backdrop-blur-md px-3 py-1 flex items-center gap-2 rounded z-10 border border-white/5">
            <div className="w-2 h-2 bg-[#4EDEA3] rounded-full"></div>
            <span className="text-[#DEE5FF] font-inter font-medium text-[10px] uppercase tracking-wide">{title}</span>
         </div>

         {/* Bottom Right Resolution */}
         <div className="absolute bottom-4 right-4 z-10">
            <span className="text-[#91AAEB] font-mono text-[10px]">1080P // 60FPS</span>
         </div>
      </div>
   )
}
