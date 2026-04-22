import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RefreshCw, Move } from 'lucide-react';
import { getCameraSnapshot } from '../services/api';

export default function LineSetupModal({ sourceUrl, initialConfig, onSave, onCancel }) {
    const [image, setImage] = useState(null);
    const [points, setPoints] = useState(initialConfig ? [
        { x: initialConfig.p1_x, y: initialConfig.p1_y },
        { x: initialConfig.p2_x, y: initialConfig.p2_y }
    ] : []);
    const [inSide, setInSide] = useState(initialConfig?.in_side ?? 1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchSnapshot = async () => {
            try {
                const blob = await getCameraSnapshot(sourceUrl);
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    setIsLoading(false);
                };
                img.src = url;
            } catch (err) {
                setError("Failed to fetch camera frame. Ensure the RTSP URL is reachable by the server.");
                setIsLoading(false);
            }
        };

        fetchSnapshot();
    }, [sourceUrl]);

    useEffect(() => {
        if (!image || !canvasRef.current) return;
        draw();
    }, [image, points, inSide]);

    const draw = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear and draw background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw Line
        if (points.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#4EDEA3';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.moveTo(points[0].x, points[0].y);

            if (points.length === 2) {
                ctx.lineTo(points[1].x, points[1].y);
                ctx.stroke();

                // Draw Direction Arrow
                drawDirectionIndicator(ctx, points[0], points[1], inSide);
            } else {
                // Drawing points
                ctx.fillStyle = '#4EDEA3';
                ctx.arc(points[0].x, points[0].y, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    const drawDirectionIndicator = (ctx, p1, p2, side) => {
        // Calculate midpoint
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;

        // Calculate normal vector
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        // Perpendicular vector
        let nx = -dy;
        let ny = dx;

        // Normalize
        const len = Math.sqrt(nx * nx + ny * ny);
        nx /= len;
        ny /= len;

        // Adjust for side
        const arrowLen = 50;
        const ex = mx + nx * arrowLen * side;
        const ey = my + ny * arrowLen * side;

        // Draw Arrow
        ctx.beginPath();
        ctx.strokeStyle = '#48ff57ff';
        ctx.lineWidth = 5;
        ctx.moveTo(mx, my);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(ey - my, ex - mx);
        const headSize = 18;
        ctx.beginPath();
        ctx.fillStyle = '#48ff57ff';
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - headSize * Math.cos(angle - Math.PI / 6), ey - headSize * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ex - headSize * Math.cos(angle + Math.PI / 6), ey - headSize * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.font = 'bold 28px Inter';
        ctx.fillStyle = '#48ff57ff';
        ctx.fillText('IN', ex + 10, ey + 10);
    };

    const handleCanvasClick = (e) => {
        if (points.length === 2) {
            setPoints([]); // Reset
            return;
        }

        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setPoints([...points, { x, y }]);
    };

    const handleSave = () => {
        if (points.length !== 2) return;
        onSave({
            p1_x: Math.round(points[0].x),
            p1_y: Math.round(points[0].y),
            p2_x: Math.round(points[1].x),
            p2_y: Math.round(points[1].y),
            in_side: inSide
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#05183C] border border-[rgba(43,70,128,0.2)] rounded-2xl w-full max-w-[900px] flex flex-col shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-[rgba(43,70,128,0.1)] flex justify-between items-center bg-[#031D4B]">
                    <div className="flex flex-col">
                        <h3 className="text-[#DEE5FF] font-space font-bold text-[18px]">Configure In/Out Line</h3>
                        <p className="text-[#91AAEB] font-inter text-[12px]">Click two points on the frame to draw a virtual crossing line.</p>
                    </div>
                    <button onClick={onCancel} className="text-[#91AAEB] hover:text-[#DEE5FF] transition-colors"><X size={24} /></button>
                </div>

                {/* Main Content */}
                <div className="p-6 flex flex-col gap-6 items-center">

                    {isLoading ? (
                        <div className="w-full aspect-video bg-[#020617] rounded-lg flex flex-col items-center justify-center gap-4 border border-[rgba(43,70,128,0.1)]">
                            <div className="animate-spin text-[#4EDEA3]"><RefreshCw size={32} /></div>
                            <span className="text-[#91AAEB] font-inter">Requesting frame from sensor...</span>
                        </div>
                    ) : error ? (
                        <div className="w-full aspect-video bg-[#020617] rounded-lg flex flex-col items-center justify-center gap-4 border border-[#EE7D77]/20 p-8 text-center text-[#EE7D77]">
                            <p className="font-inter font-medium">{error}</p>
                            <button onClick={() => window.location.reload()} className="bg-[#EE7D77]/10 px-4 py-2 rounded text-sm hover:bg-[#EE7D77]/20 transition-all font-bold">RETRY CONNECTION</button>
                        </div>
                    ) : (
                        <div className="relative group cursor-crosshair w-full max-w-full overflow-hidden rounded-lg shadow-inner bg-black border border-[rgba(43,70,128,0.2)]">
                            <canvas
                                ref={canvasRef}
                                width={image.width}
                                height={image.height}
                                onClick={handleCanvasClick}
                                className="w-full h-auto block"
                            />

                            {points.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none group-hover:bg-black/0 transition-all">
                                    <div className="bg-[#03194B]/90 backdrop-blur px-4 py-2 rounded-full border border-[#4EDEA3]/30 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#4EDEA3] animate-ping" />
                                        <span className="text-[#DEE5FF] font-inter text-sm font-bold">CLICK TO START DRAWING</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Controls Footer */}
                    {!isLoading && !error && (
                        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 bg-[#031d4b]/30 p-4 rounded-xl border border-[rgba(43,70,128,0.1)]">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-wider">Traversal Side</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setInSide(s => s * -1)}
                                            className="flex items-center gap-2 bg-[#05183C] border border-[rgba(43,70,128,0.3)] px-4 py-2 rounded hover:border-[#4EDEA3] transition-all text-[#DEE5FF] text-[13px] font-bold"
                                        >
                                            <RefreshCw size={14} className="text-[#4EDEA3]" />
                                            Flip "IN" Side
                                        </button>
                                    </div>
                                </div>
                                <div className="w-[1px] h-10 bg-[rgba(43,70,128,0.1)]" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[#91AAEB] font-inter font-bold text-[10px] uppercase tracking-wider">Reset</span>
                                    <button onClick={() => setPoints([])} className="text-[#91AAEB] hover:text-[#EE7D77] transition-all"><X size={18} /></button>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={onCancel} className="px-6 py-2.5 text-[#91AAEB] font-bold text-[14px] hover:text-[#DEE5FF]">Cancel</button>
                                <button
                                    disabled={points.length !== 2}
                                    onClick={handleSave}
                                    className="bg-[#4EDEA3] text-[#004A31] px-8 py-2.5 rounded font-bold hover:bg-[#3dcd93] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Check size={18} strokeWidth={3} />
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
