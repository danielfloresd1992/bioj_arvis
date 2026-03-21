import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';

export default forwardRef(function CameraBox({ isActive = false, faceDetection = null }, ref) {


    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraOn, setCameraOn] = useState(false);

    const startCamera = async () => {
        if (streamRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraOn(true);
        } catch (err) {
            console.error('Error al acceder a la cámara:', err);
        }
    };


    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraOn(false);
    };

    useEffect(() => {
        if (isActive && !streamRef.current) {
            startCamera();
        }
        else {
            stopCamera();
        }
    }, [isActive]);

    useEffect(() => {
        return () => stopCamera();
    }, []);

    // ── Dibujar overlay de detección facial ──
    const drawOverlay = useCallback(() => {
        const overlay = overlayRef.current;
        const video = videoRef.current;
        if (!overlay || !video) return;

        const container = overlay.parentElement;
        if (!container) return;

        overlay.width = container.clientWidth;
        overlay.height = container.clientHeight;

        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (!faceDetection) return;

        const { box, match } = faceDetection;

        // Convertir coordenadas normalizadas (0-1) a píxeles del overlay
        const bx = box.x * overlay.width;
        const by = box.y * overlay.height;
        const bw = box.width * overlay.width;
        const bh = box.height * overlay.height;

        const isRecognized = match !== null;
        const color = isRecognized ? '#10b981' : '#FF0000';

        // Dibujar cuadro del rostro
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.shadowBlur = 0;

        // Esquinas decorativas
        const cornerLen = Math.min(bw, bh) * 0.2;
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;

        // Superior izquierda
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Superior derecha
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cornerLen);
        ctx.stroke();

        // Inferior izquierda
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cornerLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cornerLen, by + bh);
        ctx.stroke();

        // Inferior derecha
        ctx.beginPath();
        ctx.moveTo(bx + bw - cornerLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cornerLen);
        ctx.stroke();

        // Etiqueta con nombre/estado
        const fontSize = Math.max(12, Math.min(overlay.height * 0.035, 18));
        ctx.font = `600 ${fontSize}px system-ui, sans-serif`;

        let label;
        if (isRecognized) {
            const pct = Math.round(match.confidence * 100);
            label = `CI: ${match.dni}  (${pct}%)`;
        } else {
            label = 'Rostro no reconocido';
        }

        const textMetrics = ctx.measureText(label);
        const padding = 6;
        const labelH = fontSize + padding * 2;
        const labelW = textMetrics.width + padding * 2;
        const labelX = bx;
        const labelY = by - labelH - 4;

        // Fondo de la etiqueta
        ctx.fillStyle = isRecognized ? 'rgba(16, 185, 129, 0.85)' : 'rgba(30, 41, 59, 0.85)';
        ctx.beginPath();
        ctx.roundRect(labelX, labelY, labelW, labelH, 6);
        ctx.fill();

        // Texto
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, labelX + padding, labelY + padding + fontSize * 0.85);
    }, [faceDetection]);

    useEffect(() => {
        drawOverlay();
    }, [faceDetection, drawOverlay]);

    // Redibujar al redimensionar
    useEffect(() => {
        const handleResize = () => drawOverlay();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [drawOverlay]);



    const getImageFileAnd64 = async (callback) => {
        if (!streamRef.current) await startCamera();
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            const file = new File([blob], 'foto.jpg', { type: 'image/jpeg' });
            const fileReader = new FileReader();
            const loadData = e => {
                callback({ base64: e.target.result, file });
                fileReader.removeEventListener('load', loadData);
            };
            fileReader.addEventListener('load', loadData);
            fileReader.readAsDataURL(file);
        }, 'image/jpeg', 0.9);
    };

    useImperativeHandle(ref, () => ({
        getImage: getImageFileAnd64,
        startCamera,
        stopCamera,
        getVideoElement: () => videoRef.current,
        getCanvasElement: () => canvasRef.current
    }));

    return (
        <div className="relative w-full flex-1 min-h-0 bg-[#0a0e13] rounded-2xl overflow-hidden border border-slate-800/60">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-500 ${cameraOn ? 'opacity-100' : 'opacity-0'}`}
            />
            <canvas ref={canvasRef} width={640} height={480} className="hidden" />

            {/* Overlay de detección facial */}
            <canvas
                ref={overlayRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {!cameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-700/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <p className="text-sm text-slate-600">Cámara en espera</p>
                </div>
            )}

            {cameraOn && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] text-white/80 font-medium">REC</span>
                </div>
            )}
        </div>
    );
});
