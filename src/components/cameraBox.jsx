import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { base64ToFile } from '../libs/file';

export default forwardRef(function CameraBox({}, ref) {

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

     useEffect(() => {
        if(videoRef.current) streamingCameraLive(); 
    }, []);




    const streamingCameraLive = async () => { 
        try { 
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false
            }); 
            if (videoRef.current) { 
                videoRef.current.srcObject = stream; 
            }
        } 
        catch (err) { 
            console.error("Error al acceder a la cámara:", err); 
        } 
    } ;


    const getImageFileAnd64 = async (callback) => { 
        const video = videoRef.current; 
        const canvas = canvasRef.current; 
        const context = canvas.getContext('2d'); // Dibujar el frame actual del video en el canvas 
        context.drawImage(video, 0, 0, canvas.width, canvas.height); // Convertir a Blob/File 

        canvas.toBlob((blob) => { 
            const file = new File([blob], 'foto.jpg', { type: 'image/jpeg' }); 
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            const loadData = e => {
                const result = e.target.result;
                callback({base64: result, file});
                fileReader.removeEventListener('load', loadData);
            };

            fileReader.addEventListener('load', loadData);
        }, 'image/jpeg', 0.9); 
    };



    
    const getImageFromCamera = async () => {
        const photo = await Camera.getPhoto({ 
            quality: 90, 
            allowEditing: false, 
            resultType: CameraResultType.Base64, // 👈 obtenemos la foto en base64
            source: CameraSource.Camera, 
            direction: 'front' // 👈 cámara frontal 
        });

        const file = base64ToFile(photo.base64String);
        return { file, base64: photo.base64String }
    };



    useImperativeHandle(ref, () => ({
        getImage: getImageFileAnd64
    }));




    return (
        <div style={{
            width: '100%',
            height: '50%',
            backgroundColor: '#000'
        }}>
             <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
        </div>
    );
});