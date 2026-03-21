import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';

export default forwardRef(function CameraBox({ isActive = false }, ref) {

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
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
    }, [isActive]);

    useEffect(() => {
        return () => stopCamera();
    }, []);

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
        stopCamera
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
