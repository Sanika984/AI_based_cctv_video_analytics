import React from 'react';

export default function FeedCard({ title, cameraId = "default", fps = 30 }) {
   const formattedFps = typeof fps === 'number' ? (Number.isInteger(fps) ? fps : fps.toFixed(1)) : fps;

   return (
      <div className="bg-[#162C5D]/30 relative rounded-lg w-full h-full flex overflow-hidden border border-[rgba(43,70,128,0.2)]">
         {/* Live Stream Frame */}
         <img 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            src={`http://localhost:8000/stream/${cameraId}`} 
            alt={`Live feed from ${title}`} 
         />

         {/* Gradient Overlay for text readability */}
         <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#06122D]/80 to-transparent z-0"></div>
         <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#06122D]/80 to-transparent z-0"></div>

         {/* Top left Active Pill */}
         <div className="absolute top-3.5 left-3.5 bg-[rgba(0,34,90,0.6)] backdrop-blur-md px-2.5 py-1 flex items-center gap-2 rounded z-10 border border-white/5 shadow-sm">
            <div className="w-2 h-2 bg-[#4EDEA3] rounded-full animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.8)]"></div>
            <span className="text-[#DEE5FF] font-inter font-medium text-[10px] uppercase tracking-wide">{title}</span>
         </div>

         {/* Bottom Right FPS Badge */}
         <div className="absolute bottom-3.5 right-3.5 z-10 bg-black/60 backdrop-blur px-2.5 py-1 rounded flex items-center border border-white/5">
            <span className="text-[#4EDEA3] font-mono text-[10px] font-semibold">{formattedFps} FPS</span>
         </div>
      </div>
   )
}

